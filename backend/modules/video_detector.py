import cv2
import os
import numpy as np
import tempfile
from modules.audio_detector import analyze_audio

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    print("Emotion analysis loaded.")
except:
    DEEPFACE_AVAILABLE = False
    print("Emotion analysis not available.")


def extract_frames(video_path, every_n_seconds=2):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if fps <= 0:
        cap.release()
        return []
    frame_paths = []
    frame_indices = list(range(
        0, total_frames, max(1, int(fps * every_n_seconds))
    ))
    for idx in frame_indices[:12]:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        cv2.imwrite(tmp.name, frame)
        frame_paths.append({
            "path": tmp.name,
            "second": round(idx / fps, 1)
        })
    cap.release()
    return frame_paths


def detect_ai_generated_video(video_path, frames):
    findings = []
    ai_score = 0

    try:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.release()

        print(f"Video: {width}x{height}, {round(duration,1)}s, {round(fps,1)}fps")

        # Check 1 - dimensions (low weight - webcams also use these)
        ai_dimensions = [
            (512, 512), (768, 512), (512, 768),
            (1024, 576), (576, 1024), (1024, 1024),
            (2048, 2048)
        ]
        if (width, height) in ai_dimensions:
            ai_score += 10
            findings.append(
                f"Dimensions {width}x{height} match AI generation sizes."
            )

        # Check 2 - camera shake
        if len(frames) >= 4:
            frame_diffs = []
            prev_gray = None
            for frame_info in frames[:10]:
                img = cv2.imread(frame_info["path"])
                if img is None:
                    continue
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                small = cv2.resize(gray, (32, 32))
                if prev_gray is not None:
                    diff = np.mean(np.abs(
                        small.astype(float) - prev_gray.astype(float)
                    ))
                    frame_diffs.append(diff)
                prev_gray = small

            if frame_diffs:
                avg_diff = np.mean(frame_diffs)
                print(f"Camera movement: {round(avg_diff,2)}")
                if avg_diff < 1.0:
                    ai_score += 35
                    findings.append(
                        f"Extremely low camera movement ({round(avg_diff,2)}). "
                        f"AI generated videos have perfect stillness."
                    )
                elif avg_diff < 2.0:
                    ai_score += 15
                    findings.append(
                        f"Very smooth camera movement ({round(avg_diff,2)})."
                    )

        # Check 3 - brightness consistency
        if len(frames) >= 4:
            brightness_values = []
            for frame_info in frames[:10]:
                img = cv2.imread(frame_info["path"])
                if img is None:
                    continue
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                brightness_values.append(float(np.mean(gray)))

            if brightness_values:
                brightness_variance = np.var(brightness_values)
                print(f"Brightness variance: {round(brightness_variance,2)}")
                if brightness_variance < 3.0:
                    ai_score += 25
                    findings.append(
                        f"Unnaturally consistent brightness "
                        f"({round(brightness_variance,2)}). "
                        f"AI videos maintain perfect exposure."
                    )

        # Check 4 - noise level (higher threshold for webcams)
        if frames:
            noise_levels = []
            for frame_info in frames[:5]:
                img = cv2.imread(frame_info["path"])
                if img is None:
                    continue
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                blur = cv2.GaussianBlur(gray, (3, 3), 0)
                noise = cv2.absdiff(gray, blur)
                noise_levels.append(float(np.mean(noise)))

            if noise_levels:
                avg_noise = np.mean(noise_levels)
                print(f"Noise: {round(avg_noise,2)}")
                if avg_noise < 1.0:
                    ai_score += 25
                    findings.append(
                        f"Extremely clean frames (noise: {round(avg_noise,2)}). "
                        f"Real cameras produce natural sensor noise."
                    )
                elif avg_noise < 1.5:
                    ai_score += 10
                    findings.append(
                        f"Very low noise level ({round(avg_noise,2)})."
                    )

        # Check 5 - short AI clip durations
        ai_durations = [2, 3, 4, 8]
        if any(abs(duration - d) < 0.3 for d in ai_durations):
            ai_score += 20
            findings.append(
                f"Duration ({round(duration,1)}s) matches "
                f"common AI generation clip lengths."
            )

        ai_score = min(ai_score, 98)
        print(f"AI video score: {ai_score}")

    except Exception as e:
        print(f"AI detection error: {e}")
        ai_score = 0

    return ai_score, findings


def analyze_emotions(frames):
    if not DEEPFACE_AVAILABLE:
        return None, "DeepFace not installed"

    emotion_sequence = []
    dominant_emotions = []

    for frame_info in frames[:8]:
        try:
            result = DeepFace.analyze(
                img_path=frame_info["path"],
                actions=["emotion"],
                enforce_detection=False,
                silent=True
            )
            if isinstance(result, list):
                result = result[0]
            emotions = result.get("emotion", {})
            dominant = result.get("dominant_emotion", "neutral")
            emotion_sequence.append({
                "second": frame_info["second"],
                "dominant": dominant,
                "emotions": emotions
            })
            dominant_emotions.append(dominant)
        except:
            continue

    if len(emotion_sequence) < 2:
        return None, "Could not detect face in enough frames"

    findings = []
    fake_score = 0
    unique_emotions = set(dominant_emotions)

    if len(unique_emotions) == 1:
        fake_score += 35
        findings.append(
            f"Emotion frozen — only '{dominant_emotions[0]}' "
            f"detected throughout video."
        )
    elif len(unique_emotions) >= 3:
        findings.append(
            f"Natural emotion variation: {', '.join(unique_emotions)}."
        )

    neutral_count = dominant_emotions.count("neutral")
    neutral_ratio = neutral_count / len(dominant_emotions)
    if neutral_ratio > 0.90:
        fake_score += 25
        findings.append(
            f"Neutral expression {round(neutral_ratio*100)}% of time."
        )

    fake_score = min(fake_score, 95)

    return {
        "frames_analyzed": len(emotion_sequence),
        "unique_emotions": list(unique_emotions),
        "dominant_emotions": dominant_emotions,
        "fake_score": fake_score,
        "findings": findings
    }, None


def check_frame_consistency(frames):
    if len(frames) < 3:
        return 0, []
    suspicious_jumps = []
    try:
        prev_gray = None
        for frame_info in frames:
            img = cv2.imread(frame_info["path"])
            if img is None:
                continue
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray_small = cv2.resize(gray, (64, 64))
            if prev_gray is not None:
                diff = np.mean(np.abs(
                    gray_small.astype(float) - prev_gray.astype(float)
                ))
                if diff > 80:
                    suspicious_jumps.append(frame_info["second"])
            prev_gray = gray_small
    except:
        pass
    return len(suspicious_jumps), suspicious_jumps


def extract_audio_from_video(video_path):
    audio_path = video_path + "_audio.wav"
    os.system(
        f'ffmpeg -i "{video_path}" '
        f'-ar 16000 -ac 1 -vn '
        f'"{audio_path}" -y -loglevel quiet'
    )
    return audio_path if os.path.exists(audio_path) else None


def analyze_video(video_path):
    evidence = []
    fake_signals = 0
    ai_video_score = 0

    print("Extracting frames...")
    frames = extract_frames(video_path)

    if not frames:
        return {
            "verdict": "ERROR",
            "score": 0,
            "summary": "Could not extract frames",
            "evidence": [{"severity": "high", "finding": "Could not process video."}],
            "transcript": "",
            "emotion_data": None,
            "what_to_check_yourself": ""
        }

    evidence.append({
        "severity": "none",
        "finding": f"Extracted {len(frames)} frames."
    })

    # AI generation detection
    print("Checking AI generation...")
    ai_video_score, ai_video_findings = detect_ai_generated_video(video_path, frames)

    if ai_video_score > 50:
        fake_signals += 1
        evidence.append({
            "severity": "high",
            "finding": (
                f"AI VIDEO GENERATION DETECTED ({ai_video_score}%). "
                f"Characteristics of AI tools detected."
            )
        })
        for finding in ai_video_findings:
            evidence.append({"severity": "high", "finding": finding})
    else:
        evidence.append({
            "severity": "none",
            "finding": f"AI generation score: {ai_video_score}% — appears natural."
        })

    # Emotion analysis
    print("Analyzing emotions...")
    emotion_summary, emotion_error = analyze_emotions(frames)
    emotion_score_val = 0

    if emotion_summary:
        emotion_score_val = emotion_summary["fake_score"]
        if emotion_score_val > 50:
            fake_signals += 1
            for finding in emotion_summary["findings"]:
                evidence.append({"severity": "high", "finding": finding})
        else:
            emotions_str = ", ".join(emotion_summary["unique_emotions"])
            evidence.append({
                "severity": "none",
                "finding": f"Emotions natural: {emotions_str}."
            })
    else:
        evidence.append({
            "severity": "none",
            "finding": f"Emotion: {emotion_error or 'skipped'}"
        })

    # Frame consistency
    jump_count, jump_times = check_frame_consistency(frames)
    if jump_count > 2:
        fake_signals += 1
        times_str = ", ".join([f"{t}s" for t in jump_times[:3]])
        evidence.append({
            "severity": "high",
            "finding": f"Visual discontinuities at: {times_str}."
        })
    else:
        evidence.append({"severity": "none", "finding": "Frame consistency passed."})

    # Audio analysis
    print("Analyzing audio...")
    audio_path = extract_audio_from_video(video_path)
    audio_result = None
    transcript = ""

    if audio_path:
        try:
            audio_result = analyze_audio(audio_path)
            transcript = audio_result.get("transcript", "")
            if audio_result.get("score", 0) > 60:
                fake_signals += 1
                for ev in audio_result.get("evidence", []):
                    if ev.get("severity") != "none":
                        evidence.append(ev)
            else:
                evidence.append({"severity": "none", "finding": "Audio sounds natural."})
        except Exception as e:
            print(f"Audio error: {e}")
        finally:
            try:
                os.unlink(audio_path)
            except:
                pass

    # Emotion speech mismatch
    if emotion_summary and transcript and len(transcript) > 20:
        positive_words = ["happy", "great", "wonderful", "love", "excellent", "good", "amazing"]
        negative_words = ["sad", "terrible", "hate", "awful", "bad", "horrible", "angry"]
        transcript_lower = transcript.lower()
        has_positive = any(w in transcript_lower for w in positive_words)
        has_negative = any(w in transcript_lower for w in negative_words)
        dominant = emotion_summary["dominant_emotions"][0] if emotion_summary["dominant_emotions"] else "neutral"

        if has_positive and dominant in ["sad", "angry", "disgust", "fear"]:
            fake_signals += 1
            evidence.append({
                "severity": "high",
                "finding": f"EMOTION-SPEECH MISMATCH: Positive words but face shows '{dominant}'."
            })
        elif has_negative and dominant in ["happy", "surprise"]:
            fake_signals += 1
            evidence.append({
                "severity": "high",
                "finding": f"EMOTION-SPEECH MISMATCH: Negative words but face shows '{dominant}'."
            })

    # Clean up
    for frame in frames:
        try:
            os.unlink(frame["path"])
        except:
            pass

    # Final score
    audio_score = audio_result.get("score", 0) if audio_result else 0
    frame_score = min(jump_count * 20, 60)

    final_score = round(
        ai_video_score * 0.40 +
        emotion_score_val * 0.20 +
        audio_score * 0.25 +
        frame_score * 0.15
    )

    if fake_signals >= 3:
        final_score = max(final_score, 75)
    elif fake_signals >= 2:
        final_score = max(final_score, 55)
    elif fake_signals == 1:
        final_score = max(final_score, 30)

    if final_score > 65:
        verdict = "AI GENERATED / MANIPULATED VIDEO"
        summary = f"Strong evidence of manipulation. AI score: {ai_video_score}%. {fake_signals} signals."
    elif final_score > 48:
        verdict = "SUSPICIOUS VIDEO"
        summary = f"Some suspicious patterns. AI score: {ai_video_score}%."
    else:
        verdict = "AUTHENTIC VIDEO"
        summary = f"No manipulation detected. AI score: {ai_video_score}% (low)."

    return {
        "verdict": verdict,
        "score": final_score,
        "summary": summary,
        "evidence": evidence,
        "transcript": transcript,
        "emotion_data": emotion_summary,
        "what_to_check_yourself": (
            "Check if video has natural camera shake. "
            "AI videos are perfectly smooth. "
            "Real recordings have slight movement."
        )
    }