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

known_entities = {
    "narendra modi", "modi", "amit shah", "rahul gandhi",
    "sonia gandhi", "manmohan singh", "arvind kejriwal",
    "yogi adityanath", "mamata banerjee", "nirmala sitharaman",
    "joe biden", "biden", "donald trump", "trump",
    "vladimir putin", "putin", "xi jinping",
    "rishi sunak", "emmanuel macron",
    "bjp", "congress", "aap", "united nations", "un",
    "who", "imf", "world bank", "nasa", "isro", "rbi",
    "supreme court", "parliament", "lok sabha", "rajya sabha",
    "google", "microsoft", "apple", "amazon", "meta",
    "facebook", "twitter", "tata", "reliance", "infosys",
    "india", "china", "usa", "russia", "uk", "pakistan",
    "new delhi", "mumbai", "delhi", "bangalore", "chennai",
    "washington", "london", "beijing", "moscow",
}


def check_sentence_uniformity(text):
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 10]
    if len(sentences) < 3:
        return []
    lengths = [len(s.split()) for s in sentences]
    avg = sum(lengths) / len(lengths)
    variance = sum((l - avg) ** 2 for l in lengths) / len(lengths)
    if variance < 15:
        return ["All sentences are almost identical in length — human writers vary naturally"]
    return []


def check_named_entities(text):
    doc = nlp(text)
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
            date_obj = datetime.strptime(f"{date_str} {current_year}", "%B %d %Y")
            actual_day = date_obj.strftime("%A")
            if actual_day.lower() != day_name.lower():
                errors.append(
                    f'Says "{day_name} {date_str}" but that date was actually a {actual_day}'
                )
        except:
            pass
    return errors


def check_impossible_claims(text):
    patterns = [
        (r'\b[1-9][0-9]{2,}\s*percent\s*(growth|increase|rise)', "Impossible percentage growth claimed"),
        (r'cure[sd]?\s*(cancer|covid|diabetes|all diseases)', "Claimed medical cure contradicts science"),
        (r'(free|freely)\s*(money|cash|laptop|phone|car)\s*(to all|for all|every citizen)', "Unusual mass free goods claim"),
        (r'(guaranteed|100%)\s*(profit|returns|income)', "100% guaranteed returns not possible"),
    ]
    findings = []
    text_lower = text.lower()
    for pattern, message in patterns:
        if re.search(pattern, text_lower):
            findings.append(message)
    return findings


def analyze_text(text):
    if not text or len(text.strip()) < 20:
        return {
            "verdict": "SKIPPED",
            "score": 0,
            "summary": "Text too short to analyze",
            "evidence": [],
            "what_to_check_yourself": "",
            "fact_check": None
        }

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
            "finding": f"AI writing classifier: {ai_score}% probability of AI authorship."
        })

    for issue in sentence_issues:
        evidence.append({"severity": "low", "finding": issue})

    for name in verified_entities:
        evidence.append({"severity": "none", "finding": f'"{name}" is a verified public figure.'})

    for name in unverified_entities:
        evidence.append({
            "severity": "high",
            "finding": f'"{name}" is not a recognised public figure — may be fabricated.'
        })

    for error in date_errors:
        evidence.append({"severity": "high", "finding": error})

    for claim in impossible_claims:
        evidence.append({"severity": "high", "finding": f"Suspicious claim: {claim}"})

    if not evidence:
        evidence.append({
            "severity": "none",
            "finding": "No suspicious patterns detected. Writing appears natural."
        })

    writing_score = ai_score
    fact_issues = len(unverified_entities) + len(date_errors) + len(impossible_claims)

    if fact_issues == 0:
        fact_score = 0
    elif fact_issues == 1:
        fact_score = 50
    elif fact_issues == 2:
        fact_score = 75
    else:
        fact_score = 90

    overall_fake_score = round(min(writing_score * 0.3 + fact_score * 0.7, 99))

    if fact_score > 60 and writing_score > 60:
        verdict = "AI GENERATED FAKE NEWS"
    elif fact_score > 60:
        verdict = "FAKE NEWS — HUMAN WRITTEN"
    elif writing_score > 70:
        verdict = "AI GENERATED — VERIFY FACTS"
    else:
        verdict = "LIKELY AUTHENTIC"

    summary_map = {
        "AI GENERATED FAKE NEWS": f"AI-written AND contains unverifiable info. AI: {writing_score}%. Facts: {fact_issues} issues.",
        "FAKE NEWS — HUMAN WRITTEN": f"Human-written but contains false info. Fact issues: {fact_issues}.",
        "AI GENERATED — VERIFY FACTS": f"Likely AI-written ({writing_score}%). Verify facts independently.",
        "LIKELY AUTHENTIC": f"Appears human-written (AI: {writing_score}%). No obvious fact errors."
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
            "Google every name mentioned. "
            "Search for the quote in trusted sources. "
            "Check if the date and day match a calendar."
        )
    }