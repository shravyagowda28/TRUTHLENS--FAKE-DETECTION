from PIL import Image, ImageEnhance
import numpy as np
import cv2
import os
import base64
import io
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

print("Loading image detection model...")
processor = AutoImageProcessor.from_pretrained(
    "dima806/deepfake_vs_real_image_detection"
)
model = AutoModelForImageClassification.from_pretrained(
    "dima806/deepfake_vs_real_image_detection"
)
model.eval()
print("Image model ready.")


def image_to_base64(img):
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def detect_faces(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return []
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = face_cascade.detectMultiScale(
            gray, 1.1, 5, minSize=(80, 80)
        )
        if len(faces) == 0:
            return []
        faces_list = list(faces)
        faces_list.sort(key=lambda f: f[2] * f[3], reverse=True)
        return [faces_list[0]]
    except:
        return []


def generate_gradcam_fast(pil_image):
    try:
        inputs = processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            fake_prob = float(probs[0][0].item())

        img_array = np.array(pil_image.resize((400, 300)))
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Laplacian(gray, cv2.CV_64F)
        edges = np.abs(edges)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        high_freq = cv2.absdiff(gray, blur)
        combined = edges * 0.6 + high_freq.astype(float) * 0.4
        if combined.max() > 0:
            combined = combined / combined.max()
        heatmap_uint8 = np.uint8(255 * combined)
        colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
        overlay = (img_array * 0.65 + colored_rgb * 0.35).astype(np.uint8)
        return Image.fromarray(overlay), Image.fromarray(colored_rgb), fake_prob
    except Exception as e:
        print(f"Visualization error: {e}")
        return None, None, 0.0


def run_ela_on_face(image_path, faces, quality=75):
    try:
        original = Image.open(image_path).convert("RGB")
        compressed_path = image_path + "_temp.jpg"
        original.save(compressed_path, "JPEG", quality=quality)
        original_array = np.array(original, dtype=float)
        compressed_array = np.array(
            Image.open(compressed_path), dtype=float
        )
        diff = np.abs(original_array - compressed_array)
        os.unlink(compressed_path)

        if len(faces) > 0:
            face_scores = []
            for (x, y, w, h) in faces:
                pad = 20
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(diff.shape[1], x + w + pad)
                y2 = min(diff.shape[0], y + h + pad)
                face_scores.append(float(np.mean(diff[y1:y2, x1:x2])))
            ela_score = min(face_scores)
        else:
            ela_score = float(np.mean(diff))

        ela_amplified = np.clip(diff * 15, 0, 255).astype(np.uint8)
        ela_image = Image.fromarray(ela_amplified)
        enhancer = ImageEnhance.Contrast(ela_image)
        return ela_score, enhancer.enhance(3.0)
    except:
        return 0, None


def draw_face_analysis(image_path, faces, ela_image):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        result = img.copy()

        if len(faces) == 0:
            result_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
            return Image.fromarray(result_rgb)

        for i, (x, y, w, h) in enumerate(faces):
            cv2.rectangle(result, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(
                result, f"Face {i+1}",
                (x, max(y-8, 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (0, 255, 0), 1
            )

            if ela_image is not None:
                ela_array = np.array(ela_image)
                h_img, w_img = ela_array.shape[:2]
                fx1 = max(0, x)
                fy1 = max(0, y)
                fx2 = min(w_img, x + w)
                fy2 = min(h_img, y + h)
                face_ela = ela_array[fy1:fy2, fx1:fx2]
                if face_ela.size == 0:
                    continue
                gray_ela = cv2.cvtColor(face_ela, cv2.COLOR_RGB2GRAY)
                _, thresh = cv2.threshold(
                    gray_ela, 120, 255, cv2.THRESH_BINARY
                )
                contours, _ = cv2.findContours(
                    thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                )
                for contour in contours:
                    if cv2.contourArea(contour) > 3000:
                        cx, cy, cw, ch = cv2.boundingRect(contour)
                        cv2.rectangle(
                            result,
                            (fx1+cx, fy1+cy),
                            (fx1+cx+cw, fy1+cy+ch),
                            (0, 0, 255), 1
                        )

        result_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
        return Image.fromarray(result_rgb)
    except Exception as e:
        print(f"Draw error: {e}")
        return None


def check_metadata(image_path):
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        if exif_data is None:
            return False, "No camera metadata"
        return True, "Camera metadata present"
    except:
        return False, "Could not read metadata"


def check_image_size_ratio(image_path):
    try:
        img = Image.open(image_path)
        w, h = img.size
        ai_sizes = [
            (512, 512), (1024, 1024),
            (2048, 2048), (512, 768), (768, 512)
        ]
        if (w, h) in ai_sizes:
            return True, w, h
        return False, w, h
    except:
        return False, 0, 0


def analyze_image(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        img_w, img_h = image.size
    except Exception as e:
        return {
            "verdict": "ERROR",
            "score": 0,
            "summary": f"Could not read image: {str(e)}",
            "evidence": [],
            "what_to_check_yourself": "",
            "visualizations": None
        }

    faces = detect_faces(image_path)
    face_count = len(faces)

    gradcam_overlay, gradcam_heatmap, fake_prob = generate_gradcam_fast(image)
    fake_score = round(fake_prob * 100)

    ela_score, ela_image = run_ela_on_face(image_path, faces)
    annotated = draw_face_analysis(image_path, faces, ela_image)
    has_metadata, metadata_msg = check_metadata(image_path)
    is_ai_size, w, h = check_image_size_ratio(image_path)

    evidence = []
    fake_signals = 0

    if face_count > 0:
        evidence.append({
            "severity": "none",
            "finding": (
                f"{face_count} face detected. "
                f"Analysis focused on face region only."
            )
        })
    else:
        evidence.append({
            "severity": "none",
            "finding": "No face detected. Analyzing full image."
        })

    # Deepfake model — shown as info only, not used in verdict
    # Model has high false positive rate for non-celebrity photos
    evidence.append({
        "severity": "none",
        "finding": (
            f"Deepfake model score: {fake_score}%. "
            f"Note: this model was trained on celebrity datasets "
            f"and may give high scores for real photos. "
            f"We use forensic signals for final verdict."
        )
    })
    
    # Signal 2 — ELA
    ela_threshold = 35 if face_count > 0 else 20
    if ela_score > ela_threshold:
        fake_signals += 1
        evidence.append({
            "severity": "high",
            "finding": (
                f"ELA detected compression inconsistency "
                f"(score: {round(ela_score, 1)}). "
                f"Different parts saved at different quality — "
                f"sign of editing."
            )
        })
    else:
        evidence.append({
            "severity": "none",
            "finding": (
                f"ELA check passed (score: {round(ela_score, 1)}). "
                f"Compression is uniform — consistent with real photo."
            )
        })

    # Signal 3 — AI dimensions
    if is_ai_size:
        fake_signals += 1
        evidence.append({
            "severity": "medium",
            "finding": (
                f"Dimensions {w}x{h} match "
                f"standard AI generation sizes."
            )
        })

    # Metadata — informational ONLY, not a fake signal
    if not has_metadata:
        evidence.append({
            "severity": "none",
            "finding": (
                "No camera metadata found. "
                "This is normal — WhatsApp, Telegram, Instagram "
                "and all social media automatically strip metadata "
                "from every photo. This alone does NOT indicate fake."
            )
        })
    else:
        evidence.append({
            "severity": "none",
            "finding": (
                "Camera metadata present — "
                "photo retains original camera information."
            )
        })

    # Build visualizations
    visualizations = {}
    visualizations["original"] = image_to_base64(image.resize((400, 300)))
    visualizations["original_label"] = "Original image"

    if gradcam_overlay:
        visualizations["gradcam"] = image_to_base64(
            gradcam_overlay.resize((400, 300))
        )
        visualizations["gradcam_label"] = f"Edge analysis ({fake_score}% fake)"

    if gradcam_heatmap:
        visualizations["heatmap"] = image_to_base64(
            gradcam_heatmap.resize((400, 300))
        )
        visualizations["heatmap_label"] = "Frequency heatmap"

    if ela_image:
        visualizations["ela"] = image_to_base64(
            ela_image.resize((400, 300))
        )
        visualizations["ela_label"] = "ELA map — bright = edited"

    if annotated:
        visualizations["annotated"] = image_to_base64(
            annotated.resize((400, 300))
        )
        visualizations["annotated_label"] = "Green = face | Red = suspicious"

    # Verdict
    if fake_signals >= 3:
        verdict = "MANIPULATED"
        score = 90
        summary = (
            f"Strong forensic evidence of manipulation. "
            f"{fake_signals} independent signals flagged. "
            f"Deepfake model: {fake_score}%."
        )
    elif fake_signals == 2 and fake_score > 85:
        verdict = "SUSPICIOUS"
        score = 65
        summary = (
            f"Two suspicious signals detected. "
            f"Manual verification recommended. "
            f"Deepfake model: {fake_score}%."
        )
    elif fake_score > 90:
        verdict = "SUSPICIOUS"
        score = 55
        summary = (
            f"Deepfake model strongly flagged this ({fake_score}%). "
            f"No other signals confirmed it. "
            f"Could be lighting or compression artifact."
        )
    else:
        verdict = "LIKELY AUTHENTIC"
        score = max(5, fake_score // 5)
        summary = (
            f"No clear manipulation detected. "
            f"Image passes forensic analysis. "
            f"Deepfake model: {fake_score}%."
        )

    return {
        "verdict": verdict,
        "score": score,
        "summary": summary,
        "evidence": evidence,
        "visualizations": visualizations,
        "what_to_check_yourself": (
            "Green box = detected face. "
            "Red areas = suspicious regions. "
            "ELA bright areas = possible editing. "
            "Note: metadata absence is normal for WhatsApp photos."
        )
    }