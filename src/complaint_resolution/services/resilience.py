import time
import logging
from typing import Callable, TypeVar
from pydantic import ValidationError

logger = logging.getLogger(__name__)

T = TypeVar("T")

MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 5


class CrewExecutionError(Exception):
    """Raised when a Crew call fails after all retries are exhausted."""
    pass


def run_with_retries(kickoff_fn: Callable[[], T], step_name: str) -> T:
    """
    Runs a Crew.kickoff() call (passed as a zero-arg callable) with retry
    and exponential backoff. Handles transient failures (rate limits,
    network errors) and structured-output validation failures separately,
    since they need different recovery strategies.
    """
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            result = kickoff_fn()

            if result.pydantic is None:
                # The LLM's output didn't validate against the expected schema.
                # This is not a transient failure — retrying with the exact
                # same prompt often produces the same malformed output, but
                # a small number of retries can help with genuinely flaky
                # formatting issues.
                logger.warning(f"[{step_name}] Output failed Pydantic validation, attempt {attempt}")
                last_error = CrewExecutionError(
                    f"{step_name}: LLM output did not match expected schema"
                )
                continue

            return result

        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = "rate_limit" in error_str or "ratelimiterror" in error_str
            is_transient = is_rate_limit or "timeout" in error_str or "connection" in error_str

            logger.error(f"[{step_name}] Attempt {attempt} failed: {e}")
            last_error = e

            if not is_transient:
                # Non-transient errors (bad config, auth failure) won't be
                # fixed by retrying — fail fast instead of wasting attempts.
                raise CrewExecutionError(f"{step_name}: non-recoverable error: {e}") from e

            if attempt < MAX_RETRIES:
                wait_time = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
                logger.info(f"[{step_name}] Transient error, retrying in {wait_time}s...")
                time.sleep(wait_time)

    raise CrewExecutionError(
        f"{step_name}: failed after {MAX_RETRIES} attempts. Last error: {last_error}"
    )