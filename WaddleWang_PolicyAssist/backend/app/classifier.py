"""Smart Query Classifier – lightweight, rule-based with LLM fallback.

Classifies an incoming query into one of:
  - factual_lookup     : direct policy question (default)
  - numeric_lookup     : asks for a number, limit, amount, percentage
  - scenario_analysis  : "if I do X", "what happens if", hypothetical
  - summary_request    : "summarize", "overview", "what does section X say"
  - policy_gap         : "is there a policy for", "does the document cover"
  - date_calculation   : "when can I", "when does X end", deadline / date math

Each class also carries a recommended `top_k` for retrieval tuning.
"""
import re
from dataclasses import dataclass


@dataclass
class QueryClass:
    label: str          # one of the 5 classes above
    top_k: int          # recommended retrieval count
    reason: str         # human-readable explanation (useful for debugging/demo)


# ---------------------------------------------------------------------------
# Keyword pattern groups
# ---------------------------------------------------------------------------

_NUMERIC_PATTERNS = re.compile(
    r"\b(how much|how many|maximum|minimum|limit|rate|amount|percentage|"
    r"reimbursement|salary|allowance|days|hours|quota|cap|ceiling|floor|"
    r"penalty|fine|fee|cost|price|budget)\b",
    re.IGNORECASE,
)

_SCENARIO_PATTERNS = re.compile(
    r"\b(if i|what if|what happens|suppose|suppose i|scenario|case where|"
    r"i was|i am|i have|i missed|i submitted|i failed to|i did not|"
    r"employee who|worker who|staff who|can i|am i eligible|will i|"
    r"would i|is it allowed|is it permissible|can an employee)\b",
    re.IGNORECASE,
)

_SUMMARY_PATTERNS = re.compile(
    r"\b(summarize|summary|overview|outline|briefly|what does .* say|"
    r"give me an overview|describe the|explain the|what is the .* section|"
    r"what are the main points|key points|highlights)\b",
    re.IGNORECASE,
)

_GAP_PATTERNS = re.compile(
    r"\b(is there a policy|does the document|does it mention|"
    r"is there any mention|is there information|does the company have|"
    r"do they have a policy|does it cover|is .* covered|"
    r"not mentioned|not covered|missing policy)\b",
    re.IGNORECASE,
)

_DATE_PATTERNS = re.compile(
    r"\b(when can i|when will i|when do i|when does|when can an employee|"
    r"how long until|how long does|how long is|end date|start date|deadline|"
    r"by when|from when|after how|complete.*probation|finish.*probation|"
    r"probation.*end|notice period|last day|join date|eligible.*date|"
    r"date.*eligible|leave.*date|return.*date|expire|expiry)\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Public classifier function
# ---------------------------------------------------------------------------

def classify_query(question: str) -> QueryClass:
    """Classify `question` into a query type and return retrieval parameters.

    Uses a pure rule-based approach — zero LLM latency overhead.
    Falls back to `factual_lookup` when no specific pattern matches.

    Example:
        >>> c = classify_query("What is the maximum reimbursement for managers?")
        >>> c.label
        'numeric_lookup'
    """
    q = question.strip()

    # Date / deadline calculation must be checked FIRST
    # (these often contain scenario words like "when can I" too)
    if _DATE_PATTERNS.search(q):
        return QueryClass(
            label="date_calculation",
            top_k=6,
            reason="Question asks for a specific date, deadline, or duration calculation.",
        )

    if _GAP_PATTERNS.search(q):
        return QueryClass(
            label="policy_gap",
            top_k=3,
            reason="Question asks whether a topic is covered in the document.",
        )

    if _SCENARIO_PATTERNS.search(q):
        return QueryClass(
            label="scenario_analysis",
            top_k=7,
            reason="Question describes a hypothetical or real-world scenario.",
        )

    if _SUMMARY_PATTERNS.search(q):
        return QueryClass(
            label="summary_request",
            top_k=10,
            reason="Question asks for a summary or overview.",
        )

    if _NUMERIC_PATTERNS.search(q):
        return QueryClass(
            label="numeric_lookup",
            top_k=4,
            reason="Question asks for a numeric value or limit.",
        )

    return QueryClass(
        label="factual_lookup",
        top_k=5,
        reason="General factual policy question.",
    )
