from transformers import pipeline
import spacy
import re
from datetime import datetime
import torch

print("Loading text detection model...")
text_classifier = pipeline(
    "text-classification",
    model="Hello-SimpleAI/chatgpt-detector-roberta",
    device=0 if torch.cuda.is_available() else -1
)
nlp = spacy.load("en_core_web_sm")
print("Text model ready.")


def check_sentence_uniformity(text):
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 10]
    if len(sentences) < 3:
        return []
    lengths = [len(s.split()) for s in sentences]
    avg = sum(lengths) / len(lengths)
    variance = sum((l - avg) ** 2 for l in lengths) / len(lengths)
    if variance < 15:
        return ["All sentences are almost identical in length — human writers naturally vary"]
    return []


def check_named_entities(text):
    """
    Finds named people and organisations in the text.
    Cross checks against a list of known Indian
    and world leaders — no internet needed.
    Anything not in the known list is flagged.
    """
    doc = nlp(text)

    # Known real people and organisations
    known_entities = {
        # Indian leaders
        "narendra modi", "modi", "amit shah", "rahul gandhi",
        "sonia gandhi", "manmohan singh", "arvind kejriwal",
        "yogi adityanath", "mamata banerjee", "nitish kumar",
        "nirmala sitharaman", "s jaishankar", "rajnath singh",
        # World leaders
        "joe biden", "biden", "donald trump", "trump",
        "vladimir putin", "putin", "xi jinping", "xi",
        "rishi sunak", "sunak", "emmanuel macron", "macron",
        "angela merkel", "merkel", "boris johnson",
        # Known organisations
        "bjp", "congress", "aap", "united nations", "un",
        "who", "world health organization", "imf", "world bank",
        "nasa", "isro", "rbi", "reserve bank of india",
        "supreme court", "parliament", "lok sabha", "rajya sabha",
        "google", "microsoft", "apple", "amazon", "meta",
        "facebook", "twitter", "tata", "reliance", "infosys",
        # Known places always verified
        "india", "china", "usa", "russia", "uk", "pakistan",
        "new delhi", "mumbai", "delhi", "bangalore", "chennai",
        "washington", "london", "beijing", "moscow",
    }

    unverified = []
    verified = []
    checked = set()

    for entity in doc.ents:
        if entity.label_ in ["PERSON", "ORG"]:
            name_lower = entity.text.lower().strip()
            if name_lower in checked:
                continue
            checked.add(name_lower)

            if name_lower in known_entities:
                verified.append(entity.text)
            else:
                unverified.append(entity.text)

    return verified[:5], unverified[:3]


def check_date_errors(text):
    errors = []
    pattern = r'(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]+(\w+\s+\d+)'
    matches = re.findall(pattern, text, re.IGNORECASE)
    for day_name, date_str in matches:
        try:
            current_year = datetime.now().year
            date_obj = datetime.strptime(
                f"{date_str} {current_year}", "%B %d %Y"
            )
            actual_day = date_obj.strftime("%A")
            if actual_day.lower() != day_name.lower():
                errors.append(
                    f'Says "{day_name} {date_str}" '
                    f'but that date was actually a {actual_day}'
                )
        except:
            pass
    return errors


def check_impossible_claims(text):
    suspicious_patterns = [
        (
            r'\b[1-9][0-9]{2,}\s*percent\s*(growth|increase|rise)',
            "Claimed percentage growth is statistically impossible"
        ),
        (
            r'cure[sd]?\s*(cancer|covid|diabetes|all diseases)',
            "Claimed medical cure contradicts established science"
        ),
        (
            r'(free|freely)\s*(money|cash|laptop|phone|car)\s*(to all|for all|every citizen)',
            "Mass free goods distribution claim is highly unusual"
        ),
        (
            r'(guaranteed|100%)\s*(profit|returns|income)',
            "100% guaranteed financial returns are not possible"
        ),
        (
            r'(aliens?|ufo)\s*(land|arriv|visit|contact)',
            "Extraordinary claim requires extraordinary evidence"
        ),
    ]
    findings = []
    text_lower = text.lower()
    for pattern, message in suspicious_patterns:
        if re.search(pattern, text_lower):
            findings.append(message)
    return findings


def analyze_text(text):
    if not text or len(text.strip()) < 50:
        return {
            "verdict": "SKIPPED",
            "score": 0,
            "summary": "Text too short to analyze",
            "evidence": [],
            "what_to_check_yourself": "",
            "fact_check": None
        }

    # All checks are offline — instant response
    result = text_classifier(text[:512])[0]
    is_ai = result["label"] == "ChatGPT"
    ai_score = round(result["score"] * 100) if is_ai else round((1 - result["score"]) * 100)

    sentence_issues = check_sentence_uniformity(text)
    verified_entities, unverified_entities = check_named_entities(text)
    date_errors = check_date_errors(text)
    impossible_claims = check_impossible_claims(text)

    evidence = []

    if ai_score > 70:
        evidence.append({
            "severity": "medium",
            "category": "writing_style",
            "finding": (
                f"AI writing classifier: {ai_score}% probability "
                f"of AI authorship. Text follows unnaturally "
                f"predictable patterns."
            )
        })

    for issue in sentence_issues:
        evidence.append({
            "severity": "low",
            "category": "writing_style",
            "finding": issue
        })

    for name in verified_entities:
        evidence.append({
            "severity": "none",
            "category": "fact_check",
            "finding": f'"{name}" is a known verified public figure or organisation.'
        })

    for name in unverified_entities:
        evidence.append({
            "severity": "high",
            "category": "fact_check",
            "finding": (
                f'"{name}" is not a recognised public figure '
                f'or known organisation. '
                f'This name may be fabricated.'
            )
        })

    for error in date_errors:
        evidence.append({
            "severity": "high",
            "category": "fact_check",
            "finding": error
        })

    for claim in impossible_claims:
        evidence.append({
            "severity": "high",
            "category": "fact_check",
            "finding": f"Suspicious claim detected: {claim}"
        })

    if not evidence:
        evidence.append({
            "severity": "none",
            "category": "general",
            "finding": (
                "No suspicious patterns detected. "
                "Writing appears natural and no false claims found."
            )
        })

    # Calculate scores
    writing_score = ai_score
    fact_issues = (
        len(unverified_entities) +
        len(date_errors) +
        len(impossible_claims)
    )

    if fact_issues == 0:
        fact_score = 0
    elif fact_issues == 1:
        fact_score = 50
    elif fact_issues == 2:
        fact_score = 75
    else:
        fact_score = 90

    overall_fake_score = round(
        min(writing_score * 0.3 + fact_score * 0.7, 99)
    )

    # Verdict with two dimensions
    if fact_score > 60 and writing_score > 60:
        verdict = "AI GENERATED FAKE NEWS"
    elif fact_score > 60:
        verdict = "FAKE NEWS — HUMAN WRITTEN"
    elif writing_score > 70:
        verdict = "AI GENERATED — VERIFY FACTS"
    else:
        verdict = "LIKELY AUTHENTIC"

    summary_map = {
        "AI GENERATED FAKE NEWS": (
            f"AI-written AND contains unverifiable or false information. "
            f"AI score: {writing_score}%. "
            f"Fact issues found: {fact_issues}."
        ),
        "FAKE NEWS — HUMAN WRITTEN": (
            f"Human-written but contains false or unverifiable information. "
            f"Fact issues found: {fact_issues}."
        ),
        "AI GENERATED — VERIFY FACTS": (
            f"Likely AI-written ({writing_score}% confidence). "
            f"No obvious fact errors but verify independently."
        ),
        "LIKELY AUTHENTIC": (
            f"Appears human-written (AI score: {writing_score}%). "
            f"No suspicious names, date errors, or impossible claims found."
        )
    }

    return {
        "verdict": verdict,
        "score": overall_fake_score,
        "writing_ai_score": writing_score,
        "fact_score": fact_score,
        "summary": summary_map[verdict],
        "evidence": evidence,
        "fact_check": {
            "verified": verified_entities,
            "unverified": unverified_entities,
            "date_errors": date_errors,
            "impossible_claims": impossible_claims
        },
        "what_to_check_yourself": (
            "Google every name mentioned in the article. "
            "Search for the specific quote in trusted news sources. "
            "Check if the date and day of week match a calendar."
        )
    }
