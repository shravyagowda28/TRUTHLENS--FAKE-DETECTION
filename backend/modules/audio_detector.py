import whisper
import librosa
import numpy as np

print("Loading audio model...")
whisper_model = whisper.load_model("base")
print("Audio model ready.")


def find_splice_points(y, sr):
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    times = librosa.frames_to_time(range(len(rms)), sr=sr, hop_length=512)
    splice_times = []
    for i in range(2, len(rms) - 2):
        before = np.mean(rms[max(0, i-3):i])
        after = np.mean(rms[i:min(len(rms), i+3)])
        if before > 0.001 and abs(after - before) / before > 0.5:
            splice_times.append(round(float(times[i]), 2))
    filtered = []
    for t in splice_times:
        if not filtered or t - filtered[-1] > 1.0:
            filtered.append(t)
    return filtered[:5]


def count_breath_pauses(y, sr):
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    threshold = np.mean(rms) * 0.05
    pause_count = 0
    in_pause = False
    for is_silent in rms < threshold:
        if is_silent and not in_pause:
            in_pause = True
            pause_count += 1
        elif not is_silent:
            in_pause = False
    return pause_count


def check_voice_naturalness(y, sr):
    artificial_score = 0
    flatness = float(np.mean(librosa.feature.spectral_flatness(y=y)))
    if flatness > 0.02:
        artificial_score += 40
    try:
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=sr
        )
        voiced_f0 = f0[voiced_flag & ~np.isnan(f0)]
        if len(voiced_f0) > 10:
            if float(np.var(voiced_f0)) < 300:
                artificial_score += 35
    except:
        pass
    zcr = librosa.feature.zero_crossing_rate(y)[0]
    if float(np.var(zcr)) < 0.0008:
        artificial_score += 25
    return min(artificial_score, 95)


def analyze_audio(audio_path):
    try:
        transcription = whisper_model.transcribe(audio_path)
        transcript = transcription["text"].strip()
        y, sr = librosa.load(audio_path, sr=None, mono=True)
        duration = round(float(len(y) / sr), 1)
    except Exception as e:
        return {
            "verdict": "ERROR",
            "score": 0,
            "summary": f"Could not process audio: {str(e)}",
            "evidence": [],
            "transcript": "",
            "what_to_check_yourself": ""
        }

    splice_times = find_splice_points(y, sr)
    breath_count = count_breath_pauses(y, sr)
    artificial_score = check_voice_naturalness(y, sr)

    evidence = []

    if artificial_score > 50:
        evidence.append({
            "severity": "high",
            "finding": (
                f"Voice naturalness score: {artificial_score}% artificial. "
                f"The frequency patterns are unnaturally consistent — "
                f"real voices have constant natural micro-variations."
            )
        })

    for t in splice_times:
        evidence.append({
            "severity": "high",
            "finding": (
                f"Audio splice detected at {t} seconds. "
                f"Background noise changes abruptly here — "
                f"two separate recordings were joined at this point."
            )
        })

    if duration > 15 and breath_count < 3:
        evidence.append({
            "severity": "high",
            "finding": (
                f"Speaker talks for {duration} seconds with only "
                f"{breath_count} breath pause(s). "
                f"A real person would breathe every 8-12 seconds."
            )
        })

    if not evidence:
        evidence.append({
            "severity": "none",
            "finding": (
                "Natural voice characteristics detected. "
                "No synthesis artifacts found."
            )
        })

    final_score = artificial_score
    if splice_times:
        final_score = min(final_score + 20 * len(splice_times), 99)
    if duration > 15 and breath_count < 3:
        final_score = min(final_score + 25, 99)

    return {
        "verdict": "SYNTHETIC VOICE" if final_score > 55 else "REAL VOICE",
        "score": final_score,
        "summary": (
            f"{'Synthetic voice detected' if final_score > 55 else 'Voice appears genuine'}. "
            f"Duration: {duration}s. "
            f"Breath pauses: {breath_count}. "
            f"Splice points: {len(splice_times)}."
        ),
        "evidence": evidence,
        "transcript": transcript,
        "what_to_check_yourself": (
            "Listen carefully at the flagged timestamps. "
            "Notice if background sound changes suddenly."
        )
    }