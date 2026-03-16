def fuse_results(text_r, image_r, audio_r, video_r):
    modules = {
        "text": text_r,
        "image": image_r,
        "audio": audio_r,
        "video": video_r
    }

    weights = {"text": 0.2, "image": 0.35, "audio": 0.2, "video": 0.25}
    total_weight = 0
    weighted_score = 0

    for key, result in modules.items():
        if result and result.get("verdict") not in ["SKIPPED", "ERROR", None]:
            weighted_score += result["score"] * weights[key]
            total_weight += weights[key]

    final_score = round(weighted_score / total_weight) if total_weight > 0 else 0

    # Boost score if strong text evidence found
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

    # Real video but fake audio
    if (image_r and audio_r and
            image_r.get("score", 0) < 40 and
            audio_r.get("score", 0) > 60):
        inconsistencies.append({
            "severity": "critical",
            "message": (
                "Video looks authentic but audio shows voice synthesis. "
                "Classic attack — real footage with a cloned voice dubbed over it."
            )
        })
        final_score = min(final_score + 20, 99)

    # Human text but fake image
    if (text_r and image_r and
        text_r.get("score", 0) < 40 and
        image_r.get("score", 0) > 60):
        inconsistencies.append({
            "severity": "high",
            "message": (
                "Text appears human-written but image shows manipulation. "
                "Real article written to give credibility to a fake image."
            )
        })
        final_score = min(final_score + 15, 99)

    # Fake audio but clean video
    if (audio_r and video_r and
            audio_r.get("score", 0) > 70 and
            video_r.get("score", 0) < 35):
        inconsistencies.append({
            "severity": "critical",
            "message": (
                "Audio is highly suspicious but video appears clean. "
                "Original voice was removed and replaced with a synthetic one."
            )
        })
        final_score = min(final_score + 25, 99)

    # Big disagreement between modalities
    scores = [
        r["score"] for r in modules.values()
        if r and r.get("verdict") not in ["SKIPPED", "ERROR", None]
    ]
    if len(scores) >= 2 and (max(scores) - min(scores)) > 50:
        inconsistencies.append({
            "severity": "medium",
            "message": (
                f"Different parts of this content tell very different stories. "
                f"One part scores {max(scores)}% suspicious, "
                f"another only {min(scores)}%. "
                f"Genuine content is always consistent."
            )
        })

    if final_score > 65:
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