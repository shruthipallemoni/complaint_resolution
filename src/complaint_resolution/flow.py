import logging
from crewai import Crew, Process
from crewai.flow.flow import Flow, start, listen, router
from pydantic import BaseModel
from typing import Optional, List

from .crew import ComplaintResolution
from .models import (
    ComplaintClassification, CustomerHistory, RiskAssessment,
    ResolutionDraft, GuardrailResult, AuditLogEntry
)
from .services.risk_scoring import calculate_risk_score
from .services.audit import build_audit_log
from .services.resilience import run_with_retries, CrewExecutionError
from .persistance.db import init_db, get_connection
from .persistance.customer_repo import get_customer_history, update_customer_history

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_REWORK_ATTEMPTS = 2


class ComplaintState(BaseModel):
    customer_id: str = ""
    complaint_text: str = ""
    classification: Optional[ComplaintClassification] = None
    history: Optional[CustomerHistory] = None
    risk_assessment: Optional[RiskAssessment] = None
    current_draft: Optional[ResolutionDraft] = None
    draft_attempts: List[ResolutionDraft] = []
    guardrail_results: List[GuardrailResult] = []
    rework_count: int = 0
    human_decision: Optional[str] = None
    final_reply: str = ""
    guardrail_exhausted: bool = False


class ComplaintFlow(Flow[ComplaintState]):

    # ---------- Flow-level steps (coarse branching only) ----------

    @start()
    def classify_complaint(self):
        print("\n[FLOW] Initializing database...")
        init_db()
        print(f"[FLOW] Classifying complaint for customer: {self.state.customer_id}")
        base = ComplaintResolution()
        one_off = Crew(
            agents=[base.classifier_agent()],
            tasks=[base.classification_task()],
            process=Process.sequential,
        )
        result = run_with_retries(
            lambda: one_off.kickoff(inputs={"complaint_text": self.state.complaint_text}),
            step_name="classify_complaint",
        )
        self.state.classification = result.pydantic
        print(f"[FLOW] Classification complete: {self.state.classification.category}")
        return self.state.classification

    @listen(classify_complaint)
    def lookup_history(self, classification):
        print(f"[FLOW] Looking up customer history for: {self.state.customer_id}")
        self.state.history = get_customer_history(self.state.customer_id)
        print(f"[FLOW] Customer history retrieved - Previous complaints: {self.state.history.previous_complaint_count}")
        return self.state.history

    @router(lookup_history)
    def assess_risk(self, history):
        self.state.risk_assessment = calculate_risk_score(self.state.classification, history)
        print(f"[FLOW] Risk Assessment - Score: {self.state.risk_assessment.risk_score}%, Requires escalation: {self.state.risk_assessment.requires_escalation}")
        route = "escalate" if self.state.risk_assessment.requires_escalation else "auto_resolve"
        print(f"[FLOW] Routing to: {route}")
        return route

    @router("auto_resolve")
    def handle_auto_resolve(self):
        self._draft(is_escalation=False)
        passed = self._guardrail_loop(is_escalation=False)
        if not passed:
            self.state.guardrail_exhausted = True
        return "needs_human_review" if not passed else "send_directly"

    @router("escalate")
    def handle_escalate(self):
        self._draft(is_escalation=True)
        passed = self._guardrail_loop(is_escalation=True)
        if not passed:
            self.state.guardrail_exhausted = True
        return "needs_human_review"

    @listen("send_directly")
    def send_auto_reply(self):
        self.state.final_reply = self.state.current_draft.draft_reply
        return self._log_and_finish()

    @listen("needs_human_review")
    def human_review(self):
        while True:
            print("\n--- HUMAN REVIEW REQUIRED ---")
            if self.state.guardrail_exhausted:
                print("⚠️  AI failed to produce a policy-compliant draft after retries — review carefully.")
            print(f"Risk score: {self.state.risk_assessment.risk_score}%")
            print(f"Reasoning: {self.state.risk_assessment.reasoning}")
            print(f"Complaint: {self.state.complaint_text}")
            print(f"Proposed action: {self.state.current_draft.proposed_action}")
            print(f"Draft reply:\n{self.state.current_draft.draft_reply}")
            decision = input("\nApprove, Edit, or Reject? (a/e/r): ").strip().lower()

            if decision in ("a", "approve"):
                self.state.human_decision = "approved"
                self.state.final_reply = self.state.current_draft.draft_reply
                return self._log_and_finish()

            if decision in ("e", "edit"):
                edited = input("Enter the edited reply: ")
                self.state.human_decision = "edited"
                self.state.final_reply = edited
                return self._log_and_finish()

            # Rejected.
            self.state.rework_count += 1
            if self.state.rework_count > MAX_REWORK_ATTEMPTS:
                print("\n⚠️ Maximum rework attempts reached. Please Approve or Edit the current draft.")
                # Don't redraft again — loop back and force a decision on what we have.
                continue

            self._draft(is_escalation=True)
            self._guardrail_loop(is_escalation=True)  # outcome ignored — human always reviews next
            # loop continues, showing the freshly redrafted reply
    # ---------- Plain Python helpers (no Flow decorators — just code) ----------

    def _draft(self, is_escalation: bool, feedback: str = None):
        base = ComplaintResolution()
        feedback_text = feedback if feedback else "This is the first attempt — no prior feedback."
        if is_escalation:
            agent, task = base.escalation_drafter_agent(), base.escalation_task()
            inputs = {
                "complaint_text": self.state.complaint_text,
                "classification": self.state.classification.model_dump(),
                "risk_assessment": self.state.risk_assessment.model_dump(),
                "previous_attempt_feedback": feedback_text,
            }
        else:
            agent, task = base.auto_resolver_agent(), base.auto_resolution_task()
            inputs = {
                "complaint_text": self.state.complaint_text,
                "classification": self.state.classification.model_dump(),
                "previous_attempt_feedback": feedback_text,
            }
        one_off = Crew(agents=[agent], tasks=[task], process=Process.sequential)
        result = run_with_retries(
            lambda: one_off.kickoff(inputs=inputs),
            step_name="draft_escalation" if is_escalation else "draft_auto_resolution",
        )
        self.state.current_draft = result.pydantic
        self.state.draft_attempts.append(result.pydantic)

    def _run_guardrail(self) -> GuardrailResult:
        base = ComplaintResolution()
        one_off = Crew(
            agents=[base.guardrail_agent()],
            tasks=[base.guardrail_task()],
            process=Process.sequential,
        )
        inputs = {
            "complaint_text": self.state.complaint_text,
            "draft_reply": self.state.current_draft.draft_reply,
            "proposed_action": self.state.current_draft.proposed_action,
        }
        result = run_with_retries(
            lambda: one_off.kickoff(inputs=inputs),
            step_name="run_guardrail",
        )
        guardrail_result = result.pydantic
        self.state.guardrail_results.append(guardrail_result)
        return guardrail_result

    def _guardrail_loop(self, is_escalation: bool) -> bool:
        while True:
            result = self._run_guardrail()
            if result.passed:
                return True
            self.state.rework_count += 1
            if self.state.rework_count > MAX_REWORK_ATTEMPTS:
                return False
            self._draft(is_escalation=is_escalation, feedback=result.failure_reason)

    def _log_and_finish(self):
        print("\n[FLOW] Building audit log...")
        entry = build_audit_log(
            customer_id=self.state.customer_id,
            complaint_text=self.state.complaint_text,
            classification=self.state.classification,
            risk_assessment=self.state.risk_assessment,
            draft_attempts=self.state.draft_attempts,
            guardrail_results=self.state.guardrail_results,
            human_decision=self.state.human_decision,
            final_reply=self.state.final_reply,
        )
        print(f"\n--- AUDIT LOG ---\n{entry.model_dump_json(indent=2)}")

        was_escalated = self.state.risk_assessment.requires_escalation if self.state.risk_assessment else False
        category = self.state.classification.category if self.state.classification else "unknown"
        print(f"\n[FLOW] Updating customer history - Category: {category}, Escalated: {was_escalated}")
        update_customer_history(self.state.customer_id, category, was_escalated)
        print("[FLOW] ✓ Complaint resolution complete and database updated!")

        return entry