# ShopEase Customer Service & Order Resolution Policy

> **FICTIONAL DOCUMENT NOTICE:** ShopEase is a fictional e-commerce company invented for this knowledge base. All numbers, rule IDs, thresholds, and procedures below are fictional and were designed specifically for AI agent testing (CrewAI multi-agent customer support). They are **inspired by general patterns** found in real e-commerce return/refund policies (see "Research Findings" and "Research Sources" at the end) but do **not** represent the actual policy of Amazon, Walmart, Shopify, or any other real company. Do not use these numbers as a factual reference for any real company's policy.

---

## 1. Purpose

This document defines the operating policy for the ShopEase AI customer-support system. It gives every agent in the pipeline (Classifier → Customer Memory Lookup → Risk Scoring → Resolution Policy/Authorization → Auto-Resolver / Human Escalation → Guardrail → Reply → Memory Update) a single, consistent, machine-checkable source of truth for:

- What refunds, replacements, or credits can be authorized automatically.
- What must always go to a human agent.
- What the AI is allowed to promise a customer, and what it must never promise.

All monetary values are in Indian Rupees (₹) unless stated otherwise. All day counts are calendar days unless stated otherwise.

---

## 2. Order Cancellation

**RULE-CAN-001**
Condition: Order has not yet been shipped (status = "Processing" or "Packed").
Action: Customer may cancel the order for a full refund.
Automatic approval: Full refund, no limit.
Human approval: No.
Reason: No cost has been incurred; low risk.

**RULE-CAN-002**
Condition: Order has already shipped (status = "Shipped" or "Out for Delivery") but not yet delivered.
Action: Cancellation is not automatic. Customer is offered "refuse delivery" or "return after delivery."
Automatic approval: Not applicable.
Human approval: No (standard message only; no payout decision needed).
Reason: Once shipped, cancellation logistics vary by courier; system should not promise a refund before the parcel's fate is known.

**RULE-CAN-003**
Condition: Order is a made-to-order / customized / personalized item, regardless of shipment status.
Action: Cancellation is only allowed within 1 hour of order placement.
Automatic approval: Full refund only if within 1-hour window.
Human approval: Yes, if customer requests cancellation after the 1-hour window.
Reason: Customization work may have already started.

---

## 3. Standard Returns

**RULE-RET-001**
Condition: Item is unopened, unused, in original packaging, and return is requested within 30 days of delivery.
Action: Return accepted; refund or replacement offered.
Automatic approval: Refund up to ₹5,000.
Human approval: Required for refunds above ₹5,000.
Reason: Standard low-risk return window, consistent with typical industry practice.

**RULE-RET-002**
Condition: Item has been opened/used but is undamaged, and return is requested within 15 days of delivery.
Action: Return accepted; restocking fee may apply (see RULE-RET-003).
Automatic approval: Refund up to ₹3,000 (after restocking fee deduction).
Human approval: Required for refunds above ₹3,000.
Reason: Higher scrutiny for used items.

**RULE-RET-003**
Condition: Item qualifies under RULE-RET-002 (opened/used, non-defective).
Action: A restocking fee of 10% of item price is deducted from the refund.
Automatic approval: Included in RULE-RET-002 auto-refund limit.
Human approval: No (fee is fixed and automatic).
Reason: Discourages return of used non-defective goods while still allowing them.

**RULE-RET-004**
Condition: Return requested after 30 days of delivery, item is non-defective.
Action: Return is denied by default.
Automatic approval: None.
Human approval: Yes, only if customer has ShopEase Plus membership (extended 45-day window) or documented extenuating circumstance.
Reason: Standard policy cutoff; exceptions need human judgment.

---

## 4. Refunds

**RULE-REF-001**
Condition: Return has been received and inspected, and passes the applicable return rule above.
Action: Refund is issued to original payment method.
Automatic approval: Per the limits in the triggering return/damage/defect rule.
Human approval: Per the triggering rule.
Reason: Refund method should match original payment for traceability.

**RULE-REF-002**
Condition: Original payment method is unavailable (e.g., closed card, expired wallet).
Action: Refund is issued as ShopEase Store Credit instead.
Automatic approval: Store credit up to ₹5,000.
Human approval: Required for store credit above ₹5,000.
Reason: Fallback payout method with same authorization ceiling philosophy.

**RULE-REF-003**
Condition: Refund processing time.
Action: State that refunds are credited within 5–7 business days after approval.
Automatic approval: Not applicable (informational only).
Human approval: No.
Reason: Standard timeline communication; not a monetary decision.

**RULE-REF-004**
Condition: Customer disputes a refund amount already issued (claims it was short by a specific amount).
Action: Do not issue a second, separate refund automatically.
Automatic approval: None.
Human approval: Yes, always.
Reason: Prevents duplicate or fraudulent double-refunding.

---

## 5. Damaged Products

**RULE-DMG-001**
Condition: Product arrived physically damaged and customer reports the issue within 7 days of delivery.
Action: Replacement or refund may be offered.
Automatic approval: Refund up to ₹2,000, or free replacement of equivalent value.
Human approval: Required for refunds above ₹2,000.
Evidence: Customer should provide photographs when available.
Reason: Damage-on-arrival is a common, low-fraud-risk scenario with a short reporting window.

**RULE-DMG-002**
Condition: Product is high-value (unit price ≥ ₹15,000) and arrived damaged.
Action: Replacement or refund may be offered, but always with human review.
Automatic approval: None — always escalate regardless of amount.
Human approval: Yes, always.
Evidence: Photographs of damage AND original packaging required.
Reason: High-value items carry higher fraud/financial risk; human judgment required regardless of category rule.

**RULE-DMG-003**
Condition: Damage reported after 7 days of delivery.
Action: Claim is not automatically eligible.
Automatic approval: None.
Human approval: Yes, case-by-case, only with strong evidence (e.g., visible manufacturing defect masked as later damage).
Reason: Late-reported damage is harder to attribute to shipping vs. customer handling.

---

## 6. Defective Products

**RULE-DEF-001**
Condition: Product fails to function as intended within 90 days of delivery (manufacturing defect, not physical damage).
Action: Free replacement offered as first option; refund offered if replacement is out of stock.
Automatic approval: Refund/replacement up to ₹4,000.
Human approval: Required above ₹4,000.
Evidence: Description of the fault; photo/video encouraged for electronics.
Reason: Defect window is longer than damage window because defects can appear over time.

**RULE-DEF-002**
Condition: Product is electronics or appliance and fails after 90 days but within the manufacturer's warranty period (if stated on the product page).
Action: Customer is directed to manufacturer warranty support; ShopEase does not refund directly.
Automatic approval: None.
Human approval: No (standard redirection message), unless customer disputes warranty applicability, then Yes.
Reason: Outside ShopEase's direct refund window; manufacturer is responsible party.

**RULE-DEF-003**
Condition: Same product model has 3 or more independent defect reports from different customers within 30 days.
Action: Flag product for internal quality review (not a customer-facing action).
Automatic approval: Not applicable — internal flag only.
Human approval: Yes, notify catalog/quality team.
Reason: Pattern may indicate a batch-level manufacturing issue.

---

## 7. Wrong Product

**RULE-WRG-001**
Condition: Customer received a different product than ordered (verified against order record), reported within 15 days of delivery.
Action: Free replacement with correct item and free return shipping for wrong item; full refund offered as alternative.
Automatic approval: Refund/replacement up to ₹6,000.
Human approval: Required above ₹6,000.
Evidence: Photo of received item and its label recommended, not mandatory.
Reason: Clear fulfillment error; low ambiguity, so higher auto-limit than generic returns.

**RULE-WRG-002**
Condition: Wrong product reported, but order record shows correct item was shipped and no fulfillment error is visible.
Action: Treat as a standard dispute, not an automatic wrong-item resolution.
Automatic approval: None.
Human approval: Yes.
Reason: Contradiction between claim and internal record needs human review.

---

## 8. Missing Items

**RULE-MIS-001**
Condition: Order marked "Delivered" but customer reports one or more items missing from the package, reported within 5 days of delivery.
Action: Missing item(s) reshipped free of charge, or refunded for the missing item(s) only.
Automatic approval: Refund up to ₹2,500 for the missing portion.
Human approval: Required above ₹2,500.
Evidence: None required for first-time claims; required for repeat claims (see Section 16).
Reason: Short reporting window keeps this low-risk for first-time claimants.

**RULE-MIS-002**
Condition: Missing item reported more than 5 days after delivery.
Action: Not automatically eligible.
Automatic approval: None.
Human approval: Yes, case-by-case.
Reason: Harder to verify after extended time has passed.

---

## 9. Lost Orders

**RULE-LST-001**
Condition: Courier tracking shows no movement for 10+ days and status is not "Delivered."
Action: Order is treated as lost; full refund or free reshipment offered.
Automatic approval: Refund/reshipment up to ₹5,000.
Human approval: Required above ₹5,000.
Reason: Tracking stall is an objective, system-verifiable signal.

**RULE-LST-002**
Condition: Courier tracking shows "Delivered" but customer states they never received the package.
Action: Do not auto-refund. Initiate courier investigation.
Automatic approval: None.
Human approval: Yes, always.
Evidence: Delivery photo/signature (if available) reviewed by human agent; customer may be asked to check with neighbors/household/building security first.
Reason: "Marked delivered but not received" carries meaningfully higher fraud risk than a stalled tracking status.

---

## 10. Late Delivery

**RULE-LAT-001**
Condition: Delivery occurs more than 3 days after the originally promised delivery date, but order is otherwise fulfilled correctly.
Action: Customer is offered a goodwill credit as compensation.
Automatic approval: Store credit of ₹100 flat, or 5% of order value (whichever is higher), capped at ₹500.
Human approval: Required if computed compensation would exceed ₹500.
Reason: Small, predictable compensation for a minor service failure; capped to prevent abuse.

**RULE-LAT-002**
Condition: Order has not arrived and is more than 7 days past the promised delivery date, and tracking still shows movement (not yet "lost" under RULE-LST-001).
Action: Customer may choose to wait, cancel for full refund, or receive the RULE-LAT-001 goodwill credit in addition to waiting.
Automatic approval: Full refund up to order value ≤ ₹5,000 if customer chooses to cancel.
Human approval: Required above ₹5,000.
Reason: Gives the customer control once delay is significant, without waiting for full "lost" classification.

---

## 11. Replacement Policy

**RULE-RPL-001**
Condition: Case is eligible under Damaged (Section 5), Defective (Section 6), Wrong Product (Section 7), or Missing Items (Section 8) rules, and the item is back in stock.
Action: Replacement is the default offered remedy before refund.
Automatic approval: Replacement value up to the same auto-approval ceiling as the triggering rule.
Human approval: Same threshold as the triggering rule.
Reason: Replacement retains the sale and is often faster for the customer.

**RULE-RPL-002**
Condition: Replacement item is out of stock or discontinued.
Action: Refund is offered instead of replacement.
Automatic approval: Same ceiling as the triggering rule.
Human approval: Same threshold as the triggering rule.
Reason: Replacement is not possible; refund is the fallback.

**RULE-RPL-003**
Condition: Customer requests a replacement with a **different** product (upgrade/downgrade), not the same item.
Action: Not automatically eligible; treated as a new order + separate return, or handled manually.
Automatic approval: None.
Human approval: Yes.
Reason: Cross-product exchanges involve price differences and are outside standard automation.

---

## 12. Compensation and Goodwill Credits

**RULE-GDW-001**
Condition: Any case where the customer experienced a verified inconvenience but does not qualify for a refund/replacement under another rule (e.g., minor packaging issue, agent delay in response).
Action: A discretionary goodwill credit may be offered.
Automatic approval: Store credit up to ₹300 per case.
Human approval: Required above ₹300, or if the same customer has already received a goodwill credit in the last 60 days.
Reason: Keeps small goodwill gestures fast while preventing repeated auto-issued credits from being farmed.

**RULE-GDW-002**
Condition: Cumulative goodwill credits issued to a single customer exceed ₹1,000 within a rolling 12-month period.
Action: Further goodwill credit requests are blocked from auto-approval.
Automatic approval: None once the cap is reached.
Human approval: Yes, always, once cap is reached.
Reason: Prevents unlimited accumulation of discretionary credits.

---

## 13. Refund Authorization Limits

**RULE-AUTH-001**
Condition: Any refund, replacement value, or credit calculated by the Auto-Resolver.
Action: Auto-Resolver may finalize the action without human sign-off only if the amount is within the ceiling specified by the specific triggering rule (Sections 5–12) **and** within the global per-case ceiling below.
Automatic approval: Global maximum auto-approved amount per case = **₹6,000**, regardless of category, unless a category rule sets a lower category-specific ceiling (in which case the lower ceiling applies).
Human approval: Required for any amount above ₹6,000, or above the category-specific ceiling — whichever is lower.
Reason: A single global ceiling acts as a hard backstop even if a category rule is misconfigured or a case spans multiple categories.

**RULE-AUTH-002**
Condition: A single order has multiple simultaneous claims (e.g., one item missing AND one item damaged) whose individual auto-approved amounts would sum to more than ₹6,000 combined.
Action: Do not auto-approve each claim independently.
Automatic approval: None once combined total exceeds ₹6,000.
Human approval: Yes, for the full combined case.
Reason: Prevents ceiling-splitting across multiple claims on the same order.

**RULE-AUTH-003**
Condition: Refund authorization limits are denominated in ₹ (INR). For international orders in other currencies, convert using the exchange rate at time of original transaction.
Action: Apply converted ₹ value against the same ceilings.
Automatic approval: Per RULE-AUTH-001.
Human approval: Per RULE-AUTH-001.
Reason: Keeps a single consistent ceiling framework regardless of currency.

---

## 14. Evidence Requirements

**RULE-EVD-001**
Condition: Claim category is Damaged Product, Defective Product, or Wrong Product.
Action: Photographic evidence is **requested** but not mandatory for first-time claims under the category's auto-approval ceiling.
Automatic approval: Not blocked by absence of evidence for first-time, in-window, in-limit claims.
Human approval: No, unless evidence is explicitly required by a more specific rule (e.g., RULE-DMG-002).
Reason: Reduces friction for genuine low-risk claims while still encouraging evidence.

**RULE-EVD-002**
Condition: Claim is a repeat claim (see Section 16) of the same category from the same customer.
Action: Photographic or video evidence becomes mandatory.
Automatic approval: Blocked until evidence is provided.
Human approval: Yes, in addition to evidence requirement.
Reason: Repeat claims carry higher fraud risk and warrant verification.

**RULE-EVD-003**
Condition: Claim amount (refund/replacement value) is above ₹3,000, regardless of category.
Action: Evidence becomes mandatory before any approval (auto or human).
Automatic approval: Blocked until evidence is provided; even then, subject to the relevant ceiling.
Human approval: As determined by the amount under RULE-AUTH-001.
Reason: Higher financial exposure warrants documentation regardless of claim type.

---

## 15. Final-Sale / Non-Returnable Items

**RULE-FSL-001**
Condition: Item is tagged "Final Sale," "Clearance," or was purchased with a discount of 50% or more.
Action: Returns and refunds for buyer's remorse are not accepted.
Automatic approval: None for non-defective returns.
Human approval: Not applicable for standard remorse returns (policy denial is automatic and final at the AI level).
Reason: Standard practice for deep-discount/clearance inventory.

**RULE-FSL-002**
Condition: Final-sale item is defective or damaged on arrival.
Action: Defect/damage rules (Sections 5–6) still apply — final-sale status does not override defect/damage protections.
Automatic approval: Per RULE-DMG-001 / RULE-DEF-001 ceilings.
Human approval: Per those same rules.
Reason: "Final sale" affects change-of-mind returns only, not the right to receive a functioning, undamaged product.

**RULE-FSL-003**
Condition: Item category is Digital Product (software licenses, digital gift cards, downloadable content) and the product has been downloaded, activated, or redeemed.
Action: Non-refundable once activated/downloaded/redeemed.
Automatic approval: None.
Human approval: Yes, only for cases of proven duplicate charge or non-delivery of the digital code itself.
Reason: Digital goods cannot be "returned" once consumed; risk of abuse is high.

**RULE-FSL-004**
Condition: Item category is Perishable Product (food, flowers, etc.).
Action: Returns not accepted for change of mind; only accepted if item arrived spoiled/damaged, reported within 24 hours of delivery.
Automatic approval: Refund up to ₹1,500 for spoiled/damaged perishables reported within 24 hours.
Human approval: Required above ₹1,500 or if reported after 24 hours.
Reason: Perishables have a very short window where a claim can still be verified as shipping-related.

---

## 16. Repeat Complaints

**RULE-RPT-001**
Condition: Customer has reported the **same issue category** (e.g., "damaged product") two or more times within the previous 90 days.
Action: Escalate to human support; do not let Auto-Resolver finalize the case.
Automatic approval: None.
Human approval: Yes, always.
Reason: Pattern suggests either a recurring fulfillment problem worth investigating or potential policy abuse — both require human judgment.

**RULE-RPT-002**
Condition: Customer has filed 4 or more complaints of **any category** within the previous 30 days.
Action: Flag customer profile as "high-frequency complainant" for the duration of the current case and future cases within the next 90 days.
Automatic approval: None while flag is active — all cases route to human review.
Human approval: Yes, for all cases while flagged.
Reason: High complaint frequency, even across different categories, warrants a closer look regardless of individual case size.

**RULE-RPT-003**
Condition: Customer has zero prior complaints or returns on file (new or long-standing low-complaint customer).
Action: Standard rules apply at full auto-approval ceilings; no additional scrutiny added.
Automatic approval: Per the relevant category rule.
Human approval: Per the relevant category rule.
Reason: No history means no elevated risk signal from history itself.

---

## 17. Human Escalation Rules

**RULE-ESC-001**
Condition: Requested refund/replacement/credit amount exceeds the applicable auto-approval ceiling (category-specific or global, whichever is lower).
Action: Route to human agent with full case summary.
Escalation trigger: Amount-based.
Reason: Core financial control.

**RULE-ESC-002**
Condition: Case matches any Repeat Complaint rule (Section 16, RULE-RPT-001 or RULE-RPT-002).
Action: Route to human agent.
Escalation trigger: History-based.
Reason: Pattern-based risk.

**RULE-ESC-003**
Condition: Case involves a Legal/Regulatory Threat (Section 18) or Customer Abuse/Threatening Language (Section 19).
Action: Route to human agent immediately, regardless of monetary amount.
Escalation trigger: Content-based (keyword/intent detection by Classifier Agent).
Reason: Legal and safety matters always require human judgment.

**RULE-ESC-004**
Condition: Classifier Agent confidence score for complaint category is below 70%.
Action: Route to human agent rather than guessing the category.
Escalation trigger: Model-confidence-based.
Reason: Low-confidence classification risks applying the wrong policy rule.

**RULE-ESC-005**
Condition: Customer explicitly asks to speak to a human agent.
Action: Route to human agent immediately.
Escalation trigger: Explicit request.
Reason: Respecting direct customer intent is a baseline service standard.

---

## 18. Legal / Regulatory Threats

**RULE-LEG-001**
Condition: Customer message contains a credible reference to legal action, a regulator, a consumer court, a chargeback dispute already filed, or similar formal/legal escalation.
Action: Mandatory human escalation. Auto-Resolver must not finalize, deny, or negotiate the case.
Automatic approval: None — no amount is auto-approved once this trigger fires, even if it would otherwise be within limits.
Human approval: Yes, always.
Reason: Legal matters require human and, where applicable, legal-team review; an AI should never negotiate under legal threat.

**RULE-LEG-002**
Condition: Case is escalated under RULE-LEG-001.
Action: The AI's auto-generated reply (if any is sent before human takeover) must be neutral, must acknowledge the concern, and must not admit fault, dispute the claim, or discuss compensation amounts.
Automatic approval: Not applicable.
Human approval: Yes, all substantive response content must be human-approved.
Reason: Avoids the AI making statements that could be used as an admission or commitment in a legal context.

---

## 19. Customer Abuse / Threatening Language

**RULE-ABU-001**
Condition: Customer message contains threats of violence, harassment, hate speech, or severe abusive language directed at staff or the company.
Action: Mandatory human escalation with priority flag; do not attempt automated resolution.
Automatic approval: None.
Human approval: Yes, always, and case should be routed to a trained specialist team where available.
Reason: Safety-related content requires human handling, not automated negotiation.

**RULE-ABU-002**
Condition: Customer is frustrated or uses strong language (e.g., swearing, all-caps) but does not threaten harm or make legal/regulatory threats.
Action: Case may still be handled by Auto-Resolver if it otherwise qualifies (amount, history, evidence).
Automatic approval: Per the relevant category rule.
Human approval: Per the relevant category rule; emotional tone alone does not force escalation.
Reason: Distinguishes genuine safety/legal risk from ordinary customer frustration, so low-risk cases aren't needlessly escalated.

---

## 20. Auto-Resolver Permissions

The Auto-Resolver **is allowed to**:

- Approve refunds, replacements, or store credit within the applicable category ceiling and the global ₹6,000 ceiling (RULE-AUTH-001).
- Apply the standard restocking fee (RULE-RET-003).
- Offer the standard goodwill credit up to ₹300 (RULE-GDW-001), subject to the 60-day/₹1,000 caps.
- Provide standard timelines (e.g., "refunds take 5–7 business days," RULE-REF-003).
- Provide the standard final-sale/digital/perishable denial message when policy is clear-cut (Section 15), where the denial itself is not a discretionary judgment call.
- Reissue a missing or lost item's value under RULE-MIS-001 / RULE-LST-001 within ceiling.

---

## 21. Actions Requiring Human Approval

The Auto-Resolver **must never finalize**, and must instead escalate, any of the following:

- Any refund, replacement, or credit above the applicable ceiling (category-specific or global ₹6,000, whichever is lower).
- Any case flagged under Repeat Complaints (Section 16, RULE-RPT-001/002).
- Any case involving a legal/regulatory threat (Section 18).
- Any case involving abusive/threatening language directed at people (Section 19, RULE-ABU-001).
- Any high-value product damage claim (RULE-DMG-002), regardless of amount.
- Any "marked delivered but not received" dispute (RULE-LST-002).
- Any request for a second refund on a case that already received one (RULE-REF-004).
- Any cross-product exchange request (RULE-RPL-003).
- Any case where Classifier confidence is below 70% (RULE-ESC-004).
- Any explicit customer request to speak to a human (RULE-ESC-005).

---

## 22. Guardrail Rules

**RULE-GRD-001**
Condition: Any outbound AI reply.
Action: The reply must never promise a specific refund amount, replacement, or credit that has not actually been approved (auto-approved by policy or approved by a human).
Reason: Prevents the AI from making commitments the company hasn't actually authorized.

**RULE-GRD-002**
Condition: Any outbound AI reply in a case pending human review.
Action: The reply may acknowledge receipt of the complaint and give an expected response time, but must not state or imply an outcome (approved, denied, or amount).
Reason: Avoids contradicting whatever the human agent ultimately decides.

**RULE-GRD-003**
Condition: Any outbound AI reply.
Action: The AI must never admit legal fault, use language like "we are liable," "we accept full responsibility for damages," or similar admissions, even for low-risk approved cases.
Reason: Legal exposure protection, independent of case size.

**RULE-GRD-004**
Condition: Any outbound AI reply.
Action: The AI must never share other customers' data, internal risk scores, internal rule IDs, or internal authorization limits with the customer.
Reason: Internal policy mechanics are not customer-facing information.

**RULE-GRD-005**
Condition: Any outbound AI reply following an approved auto-resolution.
Action: The reply must clearly state the approved action (e.g., "A refund of ₹1,200 has been approved and will be credited within 5–7 business days") rather than vague language.
Reason: Clarity reduces follow-up complaints and repeat contacts.

**RULE-GRD-006**
Condition: Any case escalated under Sections 16, 18, or 19.
Action: The AI's reply must not attempt to resolve, negotiate, or discuss amounts — only acknowledge and set expectations for human follow-up.
Reason: Reinforces mandatory human ownership of sensitive cases.

---

## 23. Policy Decision Examples

**Example 1 — Low-risk standard complaint**
Complaint: "My t-shirt arrived in the wrong size, I want to return it, it's unworn."
Customer history: No prior complaints.
Relevant rules: RULE-RET-001.
Risk implication: Low — unopened item, within window, no history.
Allowed action: Approve return + refund up to ₹5,000 automatically.
Human escalation required: No.
AI may say: "Your return has been approved. Please ship the item back within 10 days; your refund of ₹[amount] will be processed within 5–7 business days of receipt."
AI must NOT say: Anything implying refund before item is actually returned/received, if that's a policy precondition not yet met.

**Example 2 — High-value refund**
Complaint: "My ₹22,000 laptop arrived with a cracked screen."
Customer history: No prior complaints.
Relevant rules: RULE-DMG-002 (high-value damage, always escalate).
Risk implication: High — value alone triggers mandatory human review regardless of clean history.
Allowed action: None automatically; escalate.
Human escalation required: Yes.
AI may say: "I'm sorry about the damage. I've flagged this as a priority case for our specialist team, who will review your photos and follow up within 24 hours."
AI must NOT say: Any specific refund amount or promise of replacement before human review.

**Example 3 — Repeated damaged product**
Complaint: "This is the second time in two months my order arrived damaged."
Customer history: 1 prior damaged-product complaint 40 days ago.
Relevant rules: RULE-RPT-001 (same issue category twice within 90 days), RULE-DMG-001.
Risk implication: Elevated — repeat pattern in same category.
Allowed action: None automatically; escalate.
Human escalation required: Yes.
AI may say: "I can see this has happened before and I'm escalating this to our team so they can look into what's going wrong, not just resolve this one order."
AI must NOT say: An automatic refund approval or apology framed as an admission of systemic fault.

**Example 4 — Angry customer, low financial risk**
Complaint: "This is RIDICULOUS, I've been waiting a week, just fix it!!"
Customer history: No prior complaints; order is 4 days late, otherwise correctly fulfilled.
Relevant rules: RULE-LAT-001, RULE-ABU-002 (frustration without threats).
Risk implication: Low financial risk despite emotional tone.
Allowed action: Auto-approve goodwill credit per RULE-LAT-001 formula.
Human escalation required: No.
AI may say: "I completely understand the frustration — I've applied a ₹[amount] credit to your account for the delay, and your order is still on its way."
AI must NOT say: Dismissive language, or an amount beyond the RULE-LAT-001 cap.

**Example 5 — Legal-action threat**
Complaint: "I've already contacted my bank for a chargeback and I'm considering consumer court action."
Customer history: 1 prior unrelated complaint, resolved.
Relevant rules: RULE-LEG-001, RULE-ESC-003, RULE-LEG-002.
Risk implication: Critical — legal trigger overrides all other calculations.
Allowed action: None automatically; mandatory human/legal-aware escalation.
Human escalation required: Yes, always.
AI may say: "I hear your concern and I've escalated this to our senior support team, who will contact you directly."
AI must NOT say: Any admission of fault, any refund offer, any dispute of the chargeback claim.

**Example 6 — Late delivery, no other issue**
Complaint: "My order is 5 days late but otherwise fine, just annoyed."
Customer history: No prior complaints.
Relevant rules: RULE-LAT-001.
Risk implication: Low.
Allowed action: Auto-approve goodwill credit (capped at ₹500).
Human escalation required: No.
AI may say: "Sorry for the delay — a ₹[amount] credit has been added to your account, and your order should arrive shortly."
AI must NOT say: A credit amount above the RULE-LAT-001 cap.

**Example 7 — Missing package (tracking stalled)**
Complaint: "My order still shows 'in transit' from 12 days ago, no movement."
Customer history: No prior complaints.
Relevant rules: RULE-LST-001.
Risk implication: Moderate but system-verifiable.
Allowed action: Auto-approve refund or reshipment up to ₹5,000.
Human escalation required: No (unless amount exceeds ₹5,000).
AI may say: "Since tracking hasn't updated in over 10 days, I've processed a full refund of ₹[amount] / arranged a free reshipment."
AI must NOT say: Blame the courier by name in a way that implies certainty not yet confirmed.

**Example 8 — Wrong product delivered**
Complaint: "I ordered a blue jacket, received a red one."
Customer history: No prior complaints.
Relevant rules: RULE-WRG-001.
Risk implication: Low — clear, verifiable fulfillment error.
Allowed action: Auto-approve free replacement or refund up to ₹6,000.
Human escalation required: No.
AI may say: "I've arranged a free replacement in the correct color, along with free return shipping for the incorrect item."
AI must NOT say: Blame the customer for ordering incorrectly without checking the order record first.

**Example 9 — Defective product just outside window**
Complaint: "My blender motor died, I bought it 95 days ago."
Customer history: No prior complaints.
Relevant rules: RULE-DEF-001 (90-day window), RULE-DEF-002 (manufacturer warranty redirection).
Risk implication: Low-moderate — just outside ShopEase's direct window.
Allowed action: Redirect to manufacturer warranty support; no ShopEase refund automatically.
Human escalation required: No, unless customer disputes the warranty redirection.
AI may say: "Since this is just past our 90-day direct replacement window, I'd recommend reaching out to the manufacturer's warranty support, who can assist you at no cost if it's covered."
AI must NOT say: A refusal without offering the warranty path, or a promise that ShopEase will still cover it.

**Example 10 — Final-sale item, change of mind**
Complaint: "I don't like the color of this clearance jacket, can I return it?"
Customer history: No prior complaints.
Relevant rules: RULE-FSL-001.
Risk implication: Low — clear policy denial, not a judgment call.
Allowed action: Politely deny return per final-sale policy.
Human escalation required: No.
AI may say: "This item was purchased as part of our Final Sale collection, which isn't eligible for returns for personal preference reasons — this was noted at checkout."
AI must NOT say: An apology that implies the denial might be reversible, or offer a refund anyway.

**Example 11 — Refund above authorization limit**
Complaint: "I want a refund for my ₹8,500 order, item arrived broken."
Customer history: No prior complaints.
Relevant rules: RULE-DMG-001 (ceiling ₹2,000), RULE-AUTH-001 (global ceiling ₹6,000) — both are exceeded.
Risk implication: Moderate — amount-driven, not behavior-driven.
Allowed action: None automatically; escalate.
Human escalation required: Yes.
AI may say: "I've escalated this to our team for review given the order value, and someone will follow up with you shortly."
AI must NOT say: A partial promise like "you'll definitely get a full refund."

**Example 12 — Customer with multiple previous escalations**
Complaint: "My package is late again."
Customer history: 5 complaints in the last 30 days across different categories (flagged under RULE-RPT-002).
Relevant rules: RULE-RPT-002, RULE-LAT-001.
Risk implication: High — frequency flag overrides the otherwise-simple late-delivery case.
Allowed action: None automatically; escalate despite the case itself being minor.
Human escalation required: Yes.
AI may say: "I can see you've had several issues recently, so I'm having a member of our team personally review your account and this order."
AI must NOT say: Auto-approve the standard RULE-LAT-001 credit as if this were a first-time case.

**Example 13 — Customer with no previous history**
Complaint: "First time ordering — my item hasn't arrived, tracking shows nothing for 11 days."
Customer history: No prior orders or complaints (brand-new customer).
Relevant rules: RULE-LST-001, RULE-RPT-003.
Risk implication: Low — clean history, objective tracking signal.
Allowed action: Auto-approve refund/reshipment up to ₹5,000.
Human escalation required: No.
AI may say: "Welcome to ShopEase — I'm sorry your first order has been delayed. I've processed a full refund of ₹[amount] since tracking has stalled."
AI must NOT say: Treat the lack of history itself as suspicious; new customers get standard treatment, not extra scrutiny.

**Example 14 — Combination of financial impact + repeat issue**
Complaint: "Third time this quarter something's wrong — this time it's a ₹4,200 refund I'm owed for a damaged item."
Customer history: 2 prior complaints in the last 90 days (any category), now a 3rd.
Relevant rules: RULE-RPT-001, RULE-DMG-001 (ceiling ₹2,000, exceeded anyway).
Risk implication: High — both the repeat-pattern trigger and the amount independently require escalation.
Allowed action: None automatically; escalate.
Human escalation required: Yes.
AI may say: "I'm escalating this to our team given both the order value and your recent order history, so they can look at the full picture."
AI must NOT say: Address only the amount or only the history — both should be acknowledged as reasons for escalation.

**Example 15 — Combination of emotional escalation + financial impact**
Complaint: "I am SO DONE with this company, this ₹9,000 refund better happen or I'm never shopping here again!!!"
Customer history: 1 prior complaint, resolved amicably.
Relevant rules: RULE-AUTH-001 (amount exceeds global ceiling), RULE-ABU-002 (frustration without threats, does not itself force escalation).
Risk implication: Moderate-high — driven by amount, not by the emotional tone itself.
Allowed action: None automatically; escalate due to amount.
Human escalation required: Yes.
AI may say: "I understand this is frustrating, and I want to make sure it's handled properly — I've sent this to our team for review given the order value, and they'll reach out soon."
AI must NOT say: Match the customer's tone, make defensive statements, or promise the ₹9,000 refund will be approved.

---

## Machine-Readable Policy Rules

| rule_id | category | condition | action | max_auto_refund | human_approval_required | escalation_trigger |
|---|---|---|---|---|---|---|
| RULE-CAN-001 | cancellation | not yet shipped | full refund | unlimited | No | none |
| RULE-CAN-002 | cancellation | shipped, not delivered | offer refuse/return later | n/a | No | none |
| RULE-CAN-003 | cancellation | customized item, >1hr after order | deny cancellation | 0 | Yes (if requested) | customization + time window |
| RULE-RET-001 | return | unopened, ≤30 days | refund/replacement | 5000 | Above 5000 | amount |
| RULE-RET-002 | return | opened/used, ≤15 days | refund minus restocking fee | 3000 | Above 3000 | amount |
| RULE-RET-004 | return | non-defective, >30 days | deny by default | 0 | Yes (exceptions only) | policy exception request |
| RULE-DMG-001 | damage | damaged on arrival, ≤7 days | refund/replacement | 2000 | Above 2000 | amount |
| RULE-DMG-002 | damage | high-value item (≥15000) damaged | refund/replacement | 0 | Yes, always | product value |
| RULE-DMG-003 | damage | reported >7 days | deny by default | 0 | Yes (exceptions only) | late report |
| RULE-DEF-001 | defect | fails within 90 days | refund/replacement | 4000 | Above 4000 | amount |
| RULE-DEF-002 | defect | fails 90 days–warranty end | redirect to manufacturer | 0 | Yes (if disputed) | dispute of redirection |
| RULE-WRG-001 | wrong item | verified wrong item, ≤15 days | refund/replacement | 6000 | Above 6000 | amount |
| RULE-WRG-002 | wrong item | claim contradicts order record | manual review | 0 | Yes, always | record mismatch |
| RULE-MIS-001 | missing item | reported ≤5 days | refund/reship (partial) | 2500 | Above 2500 | amount |
| RULE-MIS-002 | missing item | reported >5 days | manual review | 0 | Yes, always | late report |
| RULE-LST-001 | lost order | tracking stalled ≥10 days | full refund/reship | 5000 | Above 5000 | amount |
| RULE-LST-002 | lost order | marked delivered, not received | investigate | 0 | Yes, always | fraud risk pattern |
| RULE-LAT-001 | late delivery | >3 days late, delivered correctly | goodwill credit | 500 | Above 500 | amount |
| RULE-LAT-002 | late delivery | >7 days late, still in transit | cancel for refund or wait | 5000 | Above 5000 | amount |
| RULE-GDW-001 | goodwill | verified inconvenience, no other rule fits | goodwill credit | 300 | Above 300 or 2nd in 60 days | amount / frequency |
| RULE-GDW-002 | goodwill | cumulative credits >1000 in 12 months | block further auto-credit | 0 | Yes, always | cumulative cap |
| RULE-AUTH-001 | authorization | any case | global ceiling applies | 6000 | Above 6000 (global) | amount |
| RULE-AUTH-002 | authorization | multiple claims, same order | sum against ceiling | 6000 combined | Above 6000 combined | amount (combined) |
| RULE-EVD-002 | evidence | repeat claim, same category | require evidence | n/a | Yes | repeat + missing evidence |
| RULE-EVD-003 | evidence | amount >3000, any category | require evidence | n/a | per RULE-AUTH-001 | amount + missing evidence |
| RULE-FSL-001 | final sale | tagged final sale/clearance/≥50% off | deny change-of-mind return | 0 | No | none |
| RULE-FSL-003 | digital product | activated/downloaded/redeemed | deny refund | 0 | Yes (duplicate charge only) | duplicate charge claim |
| RULE-FSL-004 | perishable | spoiled/damaged, ≤24 hrs | refund | 1500 | Above 1500 or >24 hrs | amount / time window |
| RULE-RPT-001 | repeat complaint | same category ≥2x in 90 days | escalate | 0 | Yes, always | repeat pattern |
| RULE-RPT-002 | repeat complaint | ≥4 complaints (any category) in 30 days | flag + escalate | 0 | Yes, always | frequency |
| RULE-LEG-001 | legal threat | legal/regulatory/chargeback language | escalate, no auto action | 0 | Yes, always | legal keyword/intent |
| RULE-ABU-001 | abuse | threats of violence/harassment | escalate, priority | 0 | Yes, always | safety keyword/intent |
| RULE-ESC-004 | escalation | classifier confidence <70% | escalate | 0 | Yes, always | low confidence |
| RULE-ESC-005 | escalation | customer requests human | escalate | 0 | Yes, always | explicit request |
| RULE-REF-004 | refund dispute | dispute of already-issued refund | escalate, no auto 2nd refund | 0 | Yes, always | duplicate refund risk |
| RULE-RPL-003 | replacement | cross-product exchange request | manual handling | 0 | Yes, always | product substitution |

---

## Research Findings (Real-World Reference Only — Not ShopEase Policy)

The points below summarize general, publicly stated patterns found on official company help pages at the time of research. These are provided only as background inspiration and are **not** reproduced as ShopEase's policy.

- **Amazon** (amazon.com Customer Service help pages): States most items can be returned within 30 days of delivery for a refund or replacement if in original/unused condition; refunds can take up to 30 days depending on payment method; the A-to-z Guarantee covers issues with third-party marketplace seller orders, letting buyers request a refund through "Your Orders" for delivery or item-condition problems, generally within a return window of around 30 days of delivery.
- **Walmart** (walmart.com Help Center): States a standard window of 90 days after purchase/receipt for most items purchased on Walmart.com, with shorter 30-day windows for items sold and shipped by Marketplace sellers, and category-specific exceptions (e.g., 14 days for wireless phones). Refund timelines vary by payment method (e.g., up to 7 business days for credit/debit cards).
- **Shopify** (Shopify Help Center, merchant-facing documentation): Describes merchant-configurable "return and cancellation rules" (return windows, restocking fees, return shipping cost handling) rather than one fixed policy, since Shopify is a platform used by many independent merchants. Also documents guidance for merchants on meeting EU right-of-withdrawal requirements (minimum 14-day return window from delivery of the last item).

These findings illustrate common structural concepts — tiered return windows, marketplace-seller-specific rules, payment-method-dependent refund timing, and configurable restocking fees — which informed the *categories* of rules ShopEase needed, not the specific numbers used.

---

## Research Sources

- https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7 (Amazon Return Policy)
- https://www.amazon.com/gp/help/customer/display.html?nodeId=GKQNFKFK5CF3C54B (Amazon Refund Timelines)
- https://www.amazon.com/gp/help/customer/display.html?nodeId=GQ37ZCNECJKTFYQV (Amazon A-to-z Guarantee)
- https://www.amazon.com/gp/help/customer/display.html?nodeId=GSZAYH7K2C2NVNC9 (Request an A-to-z Guarantee Refund)
- https://www.walmart.com/help/article/walmart-standard-return-policy/adc0dfb692954e67a4de206fb8d9e03a (Walmart Standard Return Policy)
- https://www.walmart.com/help/article/refunds/a86a0400e237444cb9a5f3c3ce500d1b (Walmart Refunds)
- https://help.shopify.com/en/manual/fulfillment/managing-orders/returns/return-rules (Shopify: Setting up return and cancellation rules)
- https://help.shopify.com/en/manual/fulfillment/managing-orders/returns (Shopify: Returns and exchanges)
- https://help.shopify.com/en/manual/fulfillment/managing-orders/refunding-orders (Shopify: Refunding orders)

---

*End of ShopEase Customer Service & Order Resolution Policy (fictional document, generated for CrewAI knowledge-base use).*
