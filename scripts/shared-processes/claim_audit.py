import copy
import re

ENTRIES = []
QUARANTINE = {"toolCall", "functionCalls"}
REASONS = {
    "description": "Source prose may contain capability or domain claims. Its wording has been copied, not fact-checked.",
    "summary": "Source prose may contain capability or domain claims. Its wording has been copied, not fact-checked.",
    "when": "Applicability prose is a source claim; the condition and its completeness need review.",
    "edges": "Source flow edges have no dependency rationale verified by this audit. A diagram arrow does not prove a required ordering.",
    "toolCall": "Free-text tool name. No verified operation binding or documentation reference is attached.",
    "functionCalls": "Operation descriptions mix API-like names, pseudocode and manual work. Vendor documentation must establish the actual method.",
    "route": "Agent/form/person is an inherited classification, not a check of the current host, account, tools or permissions.",
    "supportLevel": "Automation coverage is a source claim, not evidence of a successful run.",
    "supportReason": "Capability explanation requires supporting sources; importing it does not validate it.",
    "estimatedMinutes": "No per-value measurement or estimate basis was verified by this audit.",
    "activeMinutes": "No per-value measurement or estimate basis was verified by this audit.",
    "totalEstimatedMinutes": "No per-value measurement or estimate basis was verified by this audit.",
    "annoyance": "Editorial rating with no per-value basis verified by this audit.",
    "risk": "Editorial rating with no per-value basis verified by this audit.",
    "growthImpact": "Editorial rating with no per-value basis verified by this audit.",
    "timeOrder": "Editorial order must not be treated as a required dependency.",
    "reversibility": "Context-sensitive assessment; source value is not independently verified.",
    "riskLevel": "Context-sensitive assessment; source value is not independently verified.",
    "legalSignature": "A claim about a human/legal requirement needs applicable primary-source support.",
    "approvalRequired": "An inherited flag does not establish or remove actual authorization requirements.",
}


def add(source_path, field, value, disposition=None, reason=None):
    match = re.search(r"^[^[]+\[([^]]+)\]", source_path)
    entry = {
        "record": match.group(1) if match else None,
        "sourcePath": f"{source_path}.{field}",
        "field": field,
        "value": copy.deepcopy(value),
        "authorship": "not_recorded",
        "disposition": disposition or ("audit_only" if field in QUARANTINE else "flagged_annotation"),
        "reason": reason or REASONS[field],
    }
    ENTRIES.append(entry)
    return entry
