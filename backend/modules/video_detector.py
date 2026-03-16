import cv2
import os
import numpy as np
import tempfile
from modules.image_detector import analyze_image
from modules.audio_detector import analyze_audio


def extract_frames(video_path, every_n_seconds=2):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_paths = []
    frame_indices = list(range(
        0, total_frames, max(1, int(fps * every_n_seconds))
    ))
    for idx in frame_indices[:15]:
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


def extract_audio_from_video(video_path):
    audio_path = video_path + "_audio.wav"
    os.system(
        f'ffmpeg -i "{video_path}" -ar 16000 -ac 1 -vn '
        f'"{audio_path}" -y -loglevel quiet'
    )
    return audio_path if os.path.exists(audio_path) else None


def analyze_video(video_path):
    evidence = []
    frames = extract_frames(video_path, every_n_seconds=2)

    if not frames:
        return {
            "verdict": "ERROR",
            "score": 0,
            "summary": "Could not extract frames from video",
            "evidence": [],
            "what_to_check_yourself": ""
        }

    fake_frame_seconds = []
    all_scores = []

    for frame in frames:
        result = analyze_image(frame["path"])
        all_scores.append(result["score"])
        if result["score"] > 75:
            fake_frame_seconds.append(frame["second"])
        os.unlink(frame["path"])

    audio_path = extract_audio_from_video(video_path)
    audio_result = None
    if audio_path:
        audio_result = analyze_audio(audio_path)
        os.unlink(audio_path)

    avg_frame_score = round(float(np.mean(all_scores))) if all_scores else 0

    if fake_frame_seconds:
        times_str = ", ".join([f"{t}s" for t in fake_frame_seconds[:5]])
        evidence.append({
            "severity": "high",
            "finding": (
                f"Deepfake artifacts found in frames at: {times_str}. "
                f"Face appears digitally altered at these moments."
            )
        })

    if audio_result and audio_result["score"] > 55:
        for ev in audio_result["evidence"]:
            if ev["severity"] != "none":
                evidence.append(ev)

    if avg_frame_score < 40 and audio_result and audio_result["score"] > 55:
        evidence.append({
            "severity": "high",
            "finding": (
                "CROSS-MODAL ALERT: Video frames look authentic "
                "but voice shows signs of synthesis. "
                "This is a classic attack — real footage with a cloned voice."
            )
        })

    if not evidence:
        evidence.append({
            "severity": "none",
            "finding": "No manipulation detected in video frames or audio track."
        })

    final_score = avg_frame_score
    if audio_result:
        final_score = round((final_score + audio_result["score"]) / 2)
    if fake_frame_seconds:
        final_score = min(final_score + 10, 99)

    return {
        "verdict": "MANIPULATED VIDEO" if final_score > 55 else "AUTHENTIC VIDEO",
        "score": final_score,
        "summary": (
            f"Analyzed {len(frames)} frames. "
            f"Average fake score: {avg_frame_score}%. "
            f"{f'{len(fake_frame_seconds)} suspicious frame(s) found.' if fake_frame_seconds else 'All frames clean.'}"
        ),
        "evidence": evidence,
        "transcript": audio_result["transcript"] if audio_result else "",
        "what_to_check_yourself": (
            "Watch the video slowly at flagged timestamps. "
            "Focus on mouth movements vs spoken words."
        )
    }