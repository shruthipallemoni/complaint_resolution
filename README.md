# Autonomous Customer Complaint Resolution System

An AI-powered complaint resolution pipeline built with CrewAI Flows. It classifies
incoming customer complaints, scores their risk deterministically, drafts a
policy-grounded reply, validates that reply against company policy with an
automated guardrail, and routes high-risk cases to a human for approval —
recording a full audit trail of every decision along the way.

## Why this exists

Most CrewAI demo projects are single-path chatbots. Real customer support
decisions aren't linear — a complaint about a $5 shipping delay should be
handled completely differently from a $200 duplicate charge with a threat to
cancel. This project is built around that branching reality, using a CrewAI
**Flow** (not a plain sequential Crew) so the system can make different
decisions based on what's actually in the complaint, while keeping every
decision explainable and auditable.

## Architecture



*(Generated diagram available via `flow.plot()` — see `main.py`.)*

## Agent responsibilities

| Agent | Job | Why it's an agent (not code) |
|---|---|---|
| Complaint Classifier | Extracts category, $ impact, emotional tone from free text | Requires genuine language understanding |
| Escalation Drafter / Auto-Resolver | Drafts a policy-grounded customer reply | Requires reading company policy and composing natural language |
| Reply Compliance Checker (Guardrail) | Checks issue acknowledgement, policy authorization, no invented facts | Requires semantic comparison against a policy document, not just keyword matching |

**Deliberately NOT agents:** risk scoring and audit-log assembly are plain
Python. An LLM-generated risk score is unfalsifiable — you can't audit *why*
a model said "78% risk." A deterministic scoring function is fully
explainable: every point is traceable to a specific rule (financial impact
over $50, a recurring issue, an emotional-escalation signal).

## Technology choices

- **CrewAI Flow** — chosen over a plain sequential Crew specifically because
  this problem needs conditional branching (auto-resolve vs. escalate),
  which a sequential Crew can't express.
- **PostgreSQL** — durable, concurrent persistence for customer history,
  pending reviews, and audit records in deployment environments.
- **Gemini / Groq (via LiteLLM)** — switched between providers during
  development after hitting Groq's free-tier rate limits (8,000 TPM) on a
  multi-agent sequential pipeline; retry-with-backoff plus provider choice
  were both real engineering decisions, not defaults.

## Setup

```bash
git clone <repo>
cd complaint_resolution
cd backend
uv sync
cp .env.example .env   # add your model keys and DATABASE_URL
uv run crewai run
```

Start the API locally from `backend/` with:

```bash
uv run uvicorn complaint_resolution.api:app --reload --port 8000
```

Set `DATABASE_URL` to the PostgreSQL connection string supplied by your host,
for example `postgresql://user:password@host:5432/complaint_resolution`.
The service creates its tables on startup.

### Deploying the backend on Render

Create a Render Web Service from `backend/` using the existing Dockerfile. In
the service's Environment settings, replace any existing `DATABASE_URL` value
with the Internal Database URL from your Render PostgreSQL instance. It must
not contain `localhost`, `127.0.0.1`, or port `55432`. Keep the complete URL,
including its username, password, host, and database name. Do not commit that
value to `.env` or source control.

Also add the model-provider keys required by your selected CrewAI provider,
then redeploy. The Docker command uses Render's `$PORT` automatically.
Render services in the same region can use the database's Internal URL; use
the External URL only when the application runs outside Render's private
network.

For local development, start PostgreSQL from `backend/` with:

```bash
docker compose up -d
```

The local container is exposed on host port `55432` because port `5432` is
already used by another Docker service on this machine.

Stop the container with `docker compose down`. Add `-v` only when you want to
delete the local PostgreSQL data volume.

Run the evaluation suite:
```bash
uv run python evaluation/run_eval.py
```

Run tests:
```bash
uv run pytest tests/ -v
```

The React application lives in `frontend/` and is managed independently with
its own Node.js dependencies and server.

The deployed backend is available at
https://complaint-resolution.onrender.com, with interactive API documentation
at https://complaint-resolution.onrender.com/docs. The frontend defaults to
this backend URL; set `VITE_API_URL` in `frontend/.env.local` when running
against a local backend.

## Evaluation results

Run against a fixed set of 10 hand-written complaints spanning shipping,
billing, and product-defect categories:

- **Classification accuracy: 10/10 (100%)**
- **Escalation-decision accuracy: 9/10 (90%)**
- **Invalid structured outputs: 0/10**
- **Average classification latency: 3.59s**

Two transient provider errors occurred during this run (a malformed
tool-call response and a rate-limit hit) — both recovered automatically via
the retry-with-backoff layer, without needing to rerun the evaluation.

**The one miss:** a complaint stating "this is the second time this has
happened" was not escalated, because the evaluation harness intentionally
starts every case with no persisted history (for clean, repeatable
comparisons) — so a repeat-issue claim made *within the complaint text* isn't
credited unless it's also reflected in stored history. See Known Limitations.

## Known limitations

- **Repeat-issue detection depends on stored history, not complaint text.**
  A customer stating "this has happened before" isn't treated as a repeat
  issue unless the system's own records confirm it. A production version
  would have the classifier flag self-reported repeat issues as a signal
  worth a human's attention even without confirmed history.
- **Human-in-the-loop review is CLI-based (blocking `input()`), which means
  it cannot run behind a web API or dashboard as-is.** A production version
  would redesign this as a queued/webhook pattern: the flow pauses and
  persists its state, returns a "pending review" response, and a separate
  endpoint receives the human's decision asynchronously.
- **No automatic fallback to a second LLM provider.** CrewAI doesn't
  natively support this (confirmed via an open GitHub feature request as of
  this writing); retry-with-backoff on the primary provider is implemented,
  but cross-provider fallback was scoped out to avoid a hand-rolled
  workaround with more surface area for bugs.
- **Customer history updates use a read-modify-write sequence** — concurrent
  complaints for the same customer can still require an atomic update strategy
  if the deployment handles high write contention.

## Future improvements

- Async/webhook-based human review to enable a real dashboard and deployment
- Automatic LLM provider fallback once CrewAI supports it natively
- Expand the evaluation set and add LLM-as-judge scoring for reply quality
- Category-level lookup table instead of comma-joined string storage in SQLite