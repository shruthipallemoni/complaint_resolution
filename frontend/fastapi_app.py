import os
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Customer Complaint Resolution & HITL Review API",
    version="1.0.0"
)

# Enable CORS for local Vite development (e.g. http://localhost:5173 or http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class ComplaintRequest(BaseModel):
    customer_id: str = Field(..., example="CUST-984210")
    complaint_text: str = Field(..., example="I was double billed $4,200 yesterday.")

class DecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|edit_approve|reject)$")
    final_draft: Optional[str] = None
    feedback: Optional[str] = None

class Classification(BaseModel):
    category: str
    sentiment_tone: str

class RiskAssessment(BaseModel):
    score: int
    level: str
    rationale: str

class ReviewState(BaseModel):
    customer_id: str
    complaint_text: str
    classification: Optional[Classification] = None
    risk_assessment: Optional[RiskAssessment] = None
    guardrail_exhausted: bool = False
    current_draft: Optional[str] = None
    iteration_count: int = 1

class PendingReviewRecord(BaseModel):
    review_id: str
    customer_id: Optional[str] = None
    status: str = "pending"
    created_at: str
    state: ReviewState

# ---------------------------------------------------------------------------
# In-Memory Persistence (Empty on startup, ready for live data)
# ---------------------------------------------------------------------------
pending_reviews_db: Dict[str, PendingReviewRecord] = {}

def get_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

# ---------------------------------------------------------------------------
# Core Complaint Triage & Review Workflow
# ---------------------------------------------------------------------------
def evaluate_complaint(customer_id: str, complaint_text: str) -> Dict[str, Any]:
    text_lower = complaint_text.lower()

    # Risk heuristics
    score = 25
    category = "General Inquiry"
    sentiment = "Neutral"

    if any(k in text_lower for k in ["double-bill", "double bill", "refund", "charged twice", "$"]):
        category = "Billing Dispute"
        sentiment = "Frustrated / Urgent"
        score = 84
    elif any(k in text_lower for k in ["sso", "2fa", "unauthorized", "breach", "security"]):
        category = "Security & Access"
        sentiment = "Critical / Urgent"
        score = 92
    elif any(k in text_lower for k in ["legal", "lawyer", "ftc", "sla", "court", "sue"]):
        category = "Legal & Compliance"
        sentiment = "Hostile / Escalated"
        score = 88
    elif any(k in text_lower for k in ["outage", "down", "error 500", "crash"]):
        category = "Service Outage"
        sentiment = "Urgent"
        score = 55

    risk_level = "High" if score >= 75 else ("Med" if score >= 40 else "Low")
    rationale = f"Assessed based on keyword triggers and risk factors in text."

    # Decide whether to auto-resolve or escalate to Human-in-the-Loop review
    requires_human_review = score >= 70 or "escalat" in text_lower or "legal" in text_lower

    if requires_human_review:
        review_id = f"rev_{uuid.uuid4().hex[:6]}"
        draft = (
            f"Dear Customer,\n\n"
            f"Thank you for contacting us regarding your account ({customer_id}). "
            f"We take this matter very seriously and our escalations team is reviewing your complaint. "
            f"We will provide a formal remediation update promptly.\n\n"
            f"Sincerely,\nCustomer Escalations Team"
        )

        record = PendingReviewRecord(
            review_id=review_id,
            customer_id=customer_id,
            status="pending",
            created_at=get_iso_now(),
            state=ReviewState(
                customer_id=customer_id,
                complaint_text=complaint_text,
                classification=Classification(category=category, sentiment_tone=sentiment),
                risk_assessment=RiskAssessment(score=score, level=risk_level, rationale=rationale),
                guardrail_exhausted=True,
                current_draft=draft,
                iteration_count=1
            )
        )
        pending_reviews_db[review_id] = record
        return {
            "status": "pending_review",
            "review_id": review_id
        }
    else:
        auto_response = (
            f"Hello,\n\nThank you for reaching out regarding account {customer_id}. "
            f"We have processed your inquiry regarding {category.lower()} and updated your records. "
            f"If you need further help, our support team is available 24/7.\n\n"
            f"Best regards,\nCustomer Support Operations"
        )
        return {
            "status": "resolved",
            "result": {
                "customer_id": customer_id,
                "status": "resolved",
                "final_response": auto_response,
                "resolved_at": get_iso_now(),
                "resolution_method": "automated",
                "classification": {
                    "category": category,
                    "sentiment_tone": sentiment
                },
                "risk_assessment": {
                    "score": score,
                    "level": risk_level,
                    "rationale": rationale
                },
                "execution_time_ms": 120
            }
        }

# ---------------------------------------------------------------------------
# API Endpoints (Matched with frontend)
# ---------------------------------------------------------------------------
@app.post("/complaints")
@app.post("/api/complaints")
def submit_complaint(payload: ComplaintRequest):
    return evaluate_complaint(payload.customer_id, payload.complaint_text)

@app.get("/reviews/pending")
@app.get("/api/reviews/pending")
def get_pending_reviews():
    return list(pending_reviews_db.values())

@app.get("/reviews/{review_id}")
@app.get("/api/reviews/{review_id}")
def get_review(review_id: str):
    if review_id not in pending_reviews_db:
        raise HTTPException(status_code=404, detail="Review not found")
    return pending_reviews_db[review_id]

@app.post("/reviews/{review_id}/decision")
@app.post("/api/reviews/{review_id}/decision")
def post_decision(review_id: str, decision_data: DecisionRequest):
    if review_id not in pending_reviews_db:
        raise HTTPException(status_code=404, detail="Review not found")

    record = pending_reviews_db[review_id]
    final_text = ""

    if decision_data.decision == "reject":
        final_text = (
            f"Case #{review_id} for customer {record.customer_id} has been dismissed or redirected. "
            f"Reason: {decision_data.feedback or 'Rejected by reviewer.'}"
        )
    else:
        final_text = decision_data.final_draft or record.state.current_draft or "Response approved."

    # Remove from pending queue once resolved
    del pending_reviews_db[review_id]

    return {
        "status": "resolved",
        "review_id": review_id,
        "decision": decision_data.decision,
        "final_response": final_text,
        "resolved_at": get_iso_now()
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "time": get_iso_now()}

# ---------------------------------------------------------------------------
# Serve built React SPA (Optional: if running full app from FastAPI)
# ---------------------------------------------------------------------------
# If you build the React app with `npm run build`, it outputs to the `dist` directory.
# You can mount it directly to serve the entire app from Python:
if os.path.isdir("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=True)
