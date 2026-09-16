from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
from typing import Literal, Optional

from .flow import ComplaintFlow
from .services.resilience import CrewExecutionError
from .services.review_resolution import resume_review
from .persistance.db import init_db, get_connection
from .persistance.review_repo import init_reviews_table, load_pending_review
from .persistance.audit_repo import get_all_resolved, init_audit_table
from .mcp_servers.email_server import send_email

import json


def _resolved_response(audit_entry: dict, customer_email: str, email_status: str, email_error: str = ""):
    risk_assessment = audit_entry["risk_assessment"]
    human_decision = audit_entry.get("human_decision")
    return {
        "status": "resolved",
        "customer_id": audit_entry["customer_id"],
        "complaint_text": audit_entry["complaint_text"],
        "final_response": audit_entry["final_reply"],
        "resolved_at": audit_entry["timestamp"],
        "resolution_method": {
            "approved": "human_approved",
            "edited": "human_edited",
        }.get(human_decision, "automated"),
        "classification": audit_entry["classification"],
        "risk_assessment": {
            "score": risk_assessment["risk_score"],
            "level": (
                "High" if risk_assessment["risk_score"] >= 70
                else "Med" if risk_assessment["risk_score"] >= 40
                else "Low"
            ),
            "rationale": risk_assessment["reasoning"],
        },
        "proposed_action": audit_entry["draft_attempts"][-1]["proposed_action"] if audit_entry["draft_attempts"] else "",
        "policy_reference": audit_entry["draft_attempts"][-1]["policy_reference"] if audit_entry["draft_attempts"] else "",
        "email_status": email_status,
        "email_error": email_error,
    }

app = FastAPI(title="Complaint Resolution API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComplaintRequest(BaseModel):
    customer_id: str
    customer_email: str
    complaint_text: str


class SendEmailRequest(BaseModel):
    customer_email: str
    final_response: str


class ReviewDecisionRequest(BaseModel):
    decision: Literal["approve", "edit", "reject"] = Field(
        description="approve = accept draft, edit = modify draft, reject = generate a new draft"
    )
    edited_reply: Optional[str] = Field(
        default=None,
        description="Must be null for approve/reject. Required when decision is edit."
    )

    model_config = {
        "json_schema_extra": {
            "example": {"decision": "approve", "edited_reply": None}
        }
    }

    @model_validator(mode="after")
    def check_edited_reply_required(self):
        if self.decision == "edit" and not self.edited_reply:
            raise ValueError("edited_reply is required when decision is 'edit'")
        if self.decision != "edit" and self.edited_reply is not None:
            raise ValueError("edited_reply must be null when decision is 'approve' or 'reject'")
        return self


@app.on_event("startup")
def startup():
    init_db()
    init_reviews_table()
    init_audit_table()


@app.post("/complaints")
def submit_complaint(request: ComplaintRequest):
    flow = ComplaintFlow(interactive=False)
    try:
        result = flow.kickoff(inputs={
            "customer_id": request.customer_id,
            "customer_email": request.customer_email,
            "complaint_text": request.complaint_text,
        })
    except CrewExecutionError as exc:
        raise HTTPException(
            status_code=503,
            detail="The AI service is temporarily unavailable. Please try submitting again in a moment.",
        ) from exc
    if isinstance(result, dict) and result.get("status") == "pending_review":
        return {"status": "pending_review", "review_id": result["review_id"]}

    audit_entry = result.model_dump(mode="json")
    return {
        "status": "resolved",
        "result": _resolved_response(audit_entry, request.customer_email, "not_sent"),
    }


@app.get("/complaints/resolved")
def list_resolved_complaints(limit: int = 50):
    return get_all_resolved(limit)


@app.post("/complaints/send-email")
def send_complaint_email(request: SendEmailRequest):
    if "@" not in request.customer_email:
        raise HTTPException(status_code=400, detail="The submitted customer email is invalid")
    if not request.final_response.strip():
        raise HTTPException(status_code=400, detail="The complaint response is empty")

    try:
        message = send_email(
            to=request.customer_email,
            subject="Regarding your complaint",
            body=request.final_response,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Email delivery failed: {exc}") from exc

    return {"status": "sent", "message": message, "recipient": request.customer_email}


# NOTE: this static-path route MUST be defined before GET /reviews/{review_id} —
# FastAPI matches routes in definition order, and the wildcard route would
# otherwise swallow "/reviews/pending" as if "pending" were a review_id.
@app.get("/reviews/pending")
def list_pending_reviews():
    conn = get_connection()
    rows = conn.execute(
        "SELECT review_id, state_json, created_at FROM pending_reviews WHERE status = 'pending'"
    ).fetchall()
    conn.close()
    return [
        {"review_id": r["review_id"], "state": json.loads(r["state_json"]), "created_at": r["created_at"]}
        for r in rows
    ]


@app.get("/reviews/{review_id}")
def get_review(review_id: str):
    record = load_pending_review(review_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Review not found")
    if record["status"] != "pending":
        raise HTTPException(status_code=409, detail=f"Review already {record['status']}")

    state = record["state"]
    return {
        "review_id": review_id,
        "complaint_text": state["complaint_text"],
        "classification": state["classification"],
        "risk_assessment": state["risk_assessment"],
        "guardrail_exhausted": state.get("guardrail_exhausted", False),
        "current_draft": state["current_draft"],
    }


@app.post("/reviews/{review_id}/decision")
def submit_decision(review_id: str, request: ReviewDecisionRequest):
    try:
        result = resume_review(review_id, request.decision, request.edited_reply)
        if result.get("status") == "pending_review":
            return result
        record = load_pending_review(review_id)
        customer_email = record["state"].get("customer_email", "") if record else ""
        return {
            "status": "resolved",
            "result": _resolved_response(result, customer_email, "not_sent"),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/reviews/{review_id}/send-email")
def send_review_email(review_id: str):
    record = load_pending_review(review_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Review not found")
    if record["status"] != "resolved":
        raise HTTPException(status_code=409, detail="Approve the review before sending email")

    state = record["state"]
    recipient = state.get("customer_email", "")
    final_reply = state.get("final_reply", "")
    if "@" not in recipient:
        raise HTTPException(status_code=400, detail="The submitted customer email is invalid")
    if not final_reply:
        raise HTTPException(status_code=409, detail="No approved reply is available to send")

    try:
        message = send_email(
            to=recipient,
            subject="Regarding your complaint",
            body=final_reply,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Email delivery failed: {exc}") from exc

    return {"status": "sent", "message": message, "recipient": recipient}


@app.post("/api/reset-demo")
def reset_demo():
    conn = get_connection()
    conn.execute("DELETE FROM pending_reviews")
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Reviews table cleared"}