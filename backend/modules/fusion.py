def fuse_results(text_r, image_r, audio_r, video_r):
    modules = {
        "text": text_r,
        "image": image_r,
        "audio": audio_r,
        "video": video_r
    }

    weights = {
        "text": 0.25,
        "image": 0.30,
        "audio": 0.20,
        "video": 0.25
    }

    total_weight = 0
    weighted_score = 0

    for key, result in modules.items():
        if result and result.get("verdict") not in [
            "SKIPPED", "ERROR", None
        ]:
            weighted_score += result["score"] * weights[key]
            total_weight += weights[key]

    final_score = round(
        weighted_score / total_weight
    ) if total_weight > 0 else 0

    if text_r and text_r.get("verdict") not in ["SKIPPED", "ERROR"]:
        high_evidence = [
            e for e in text_r.get("evidence", [])
            if e.get("severity") == "high"
        ]
        if len(high_evidence) >= 2:
            final_score = max(final_score, 75)
        elif len(high_evidence) == 1:
            final_score = max(final_score, 60)

    inconsistencies = []

    if (image_r and audio_r and
            image_r.get("score", 0) < 40 and
            audio_r.get("score", 0) > 60):
        inconsistencies.append({
            "severity": "critical",
            "message": (
                "Video looks authentic but audio shows "
                "voice synthesis. Classic deepfake attack."
            )
        })
        final_score = min(final_score + 20, 99)

    if (text_r and image_r and
            text_r.get("score", 0) < 40 and
            image_r.get("score", 0) > 70):
        inconsistencies.append({
            "severity": "high",
            "message": (
                "Text appears human-written but image "
                "shows manipulation."
            )
        })
        final_score = min(final_score + 15, 99)

    if (audio_r and video_r and
            audio_r.get("score", 0) > 70 and
            video_r.get("score", 0) < 35):
        inconsistencies.append({
            "severity": "critical",
            "message": (
                "Audio is highly suspicious but video "
                "appears clean. Voice was replaced."
            )
        })
        final_score = min(final_score + 25, 99)

    scores = [
        r["score"] for r in modules.values()
        if r and r.get("verdict") not in ["SKIPPED", "ERROR", None]
    ]
    if len(scores) >= 2 and (max(scores) - min(scores)) > 55:
        inconsistencies.append({
            "severity": "medium",
            "message": (
                f"Different parts score very differently — "
                f"{max(scores)}% vs {min(scores)}%. "
                f"Genuine content is always consistent."
            )
        })

    if final_score > 60:
        overall_verdict = "LIKELY FAKE / MANIPULATED"
    elif final_score > 45:
        overall_verdict = "SUSPICIOUS — VERIFY MANUALLY"
    else:
        overall_verdict = "LIKELY AUTHENTIC"

    return {
        "overall_verdict": overall_verdict,
        "overall_score": final_score,
        "modules": modules,
        "inconsistencies": inconsistencies
    }
