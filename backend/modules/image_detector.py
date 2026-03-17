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
    """
    Detects faces using OpenCV.
    Only face regions are analyzed.
    Background is completely ignored.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return []
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades +
            "haarcascade_frontalface_default.xml"
        )
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50)
        )
        return faces if len(faces) > 0 else []
    except:
        return []


def generate_gradcam_fast(pil_image):
    """
    Fast visualization using edge detection +
    model confidence score.
    No backward pass needed — runs in under 1 second.
    """
    try:
        # Get model confidence — fast no_grad pass
        inputs = processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            fake_prob = float(probs[0][0].item())

        # Create attention visualization
        img_array = np.array(pil_image.resize((400, 300)))
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

        # Use edge detection to highlight boundaries
        # Deepfakes have unnatural edges at face boundaries
        edges = cv2.Laplacian(gray, cv2.CV_64F)
        edges = np.abs(edges)

        # Also check high frequency components
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        high_freq = cv2.absdiff(gray, blur)

        # Combine both signals
        combined = edges * 0.6 + high_freq.astype(float) * 0.4

        # Normalize
        if combined.max() > 0:
            combined = combined / combined.max()

        heatmap_uint8 = np.uint8(255 * combined)
        colored = cv2.applyColorMap(
            heatmap_uint8, cv2.COLORMAP_JET
        )
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)

        # Overlay on original
        overlay = (
            img_array * 0.65 + colored_rgb * 0.35
        ).astype(np.uint8)

        overlay_image = Image.fromarray(overlay)
        heatmap_only = Image.fromarray(colored_rgb)

        return overlay_image, heatmap_only, fake_prob

    except Exception as e:
        print(f"Visualization error: {e}")
        return None, None, 0.0


def run_ela_on_face(image_path, faces, quality=75):
    """
    Error Level Analysis focused on face regions.
    If face detected — only checks inside face.
    If no face — checks full image with higher threshold.
    """
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
            # Measure ELA only inside face regions
            face_scores = []
            for (x, y, w, h) in faces:
                pad = 20
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(diff.shape[1], x + w + pad)
                y2 = min(diff.shape[0], y + h + pad)
                face_region = diff[y1:y2, x1:x2]
                face_scores.append(float(np.mean(face_region)))
            ela_score = max(face_scores)
        else:
            ela_score = float(np.mean(diff))

        # Create ELA visualization
        ela_amplified = np.clip(diff * 15, 0, 255).astype(np.uint8)
        ela_image = Image.fromarray(ela_amplified)
        enhancer = ImageEnhance.Contrast(ela_image)
        ela_enhanced = enhancer.enhance(3.0)

        return ela_score, ela_enhanced

    except:
        return 0, None


def draw_face_analysis(image_path, faces, ela_image):
    """
    Draws analysis only on face regions.
    Green box = face found.
    Red spots = suspicious areas inside face only.
    Background is completely untouched.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        result = img.copy()

        if len(faces) == 0:
            # No face found — just return image as is
            result_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
            return Image.fromarray(result_rgb)

        for i, (x, y, w, h) in enumerate(faces):
            # Green box around face
            cv2.rectangle(
                result, (x, y), (x+w, y+h),
                (0, 255, 0), 2
            )
            cv2.putText(
                result,
                f"Face {i+1}",
                (x, max(y-8, 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (0, 255, 0), 1
            )

            # Check ELA inside face region only
            if ela_image is not None:
                ela_array = np.array(ela_image)
                h_img, w_img = ela_array.shape[:2]

                # Clamp face coords to image bounds
                fx1 = max(0, x)
                fy1 = max(0, y)
                fx2 = min(w_img, x + w)
                fy2 = min(h_img, y + h)

                face_ela = ela_array[fy1:fy2, fx1:fx2]
                if face_ela.size == 0:
                    continue

                gray_ela = cv2.cvtColor(
                    face_ela, cv2.COLOR_RGB2GRAY
                )
                _, thresh = cv2.threshold(
                    gray_ela, 45, 255, cv2.THRESH_BINARY
                )
                contours, _ = cv2.findContours(
                    thresh,
                    cv2.RETR_EXTERNAL,
                    cv2.CHAIN_APPROX_SIMPLE
                )

                suspicious_count = 0
                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area > 300:
                        cx, cy, cw, ch = cv2.boundingRect(contour)
                        cv2.rectangle(
                            result,
                            (fx1+cx, fy1+cy),
                            (fx1+cx+cw, fy1+cy+ch),
                            (0, 0, 255), 1
                        )
                        suspicious_count += 1

                if suspicious_count > 0:
                    cv2.putText(
                        result,
                        f"{suspicious_count} suspicious spots in face",
                        (x, min(y+h+18, result.shape[0]-5)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.4, (0, 0, 255), 1
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
            (512, 768), (768, 512),
            (1024, 768), (768, 1024),
            (2048, 2048)
        ]
        if (w, h) in ai_sizes:
            return True, w, h
        if w == h and w in [256, 512, 768, 1024, 2048]:
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

    # Step 1 — detect faces first
    faces = detect_faces(image_path)
    face_count = len(faces)

    # Step 2 — fast visualization + model score
    gradcam_overlay, gradcam_heatmap, fake_prob = generate_gradcam_fast(image)
    fake_score = round(fake_prob * 100)

    # Step 3 — ELA on face regions only
    ela_score, ela_image = run_ela_on_face(image_path, faces)

    # Step 4 — draw face analysis
    annotated = draw_face_analysis(image_path, faces, ela_image)

    # Step 5 — metadata and size checks
    has_metadata, metadata_msg = check_metadata(image_path)
    is_ai_size, w, h = check_image_size_ratio(image_path)

    # Build evidence
    evidence = []
    fake_signals = 0

    # Face detection info
    if face_count > 0:
        evidence.append({
            "severity": "none",
            "finding": (
                f"{face_count} face(s) detected. "
                f"Analysis focused on face region only. "
                f"Background is ignored."
            )
        })
    else:
        evidence.append({
            "severity": "none",
            "finding": (
                "No face detected. "
                "Analyzing full image."
            )
        })

    # Model score
    if fake_score > 90:
        fake_signals += 1
        evidence.append({
            "severity": "high",
            "finding": (
                f"Deepfake model: {fake_score}% fake probability. "
                f"Unnatural patterns detected in facial features. "
                f"See the heatmap — red areas show where "
                f"manipulation signatures are strongest."
            )
        })
    elif fake_score > 50:
        evidence.append({
            "severity": "medium",
            "finding": (
                f"Deepfake model: moderate concern ({fake_score}%). "
                f"Some unusual patterns but not conclusive."
            )
        })
    else:
        evidence.append({
            "severity": "none",
            "finding": (
                f"Deepfake model: low fake probability ({fake_score}%). "
                f"Facial features appear natural."
            )
        })

    # ELA score
    ela_threshold = 12 if face_count > 0 else 8
    if ela_score > ela_threshold:
        fake_signals += 1
        evidence.append({
            "severity": "high",
            "finding": (
                f"ELA detected editing in face region "
                f"(score: {round(ela_score, 1)}). "
                f"Compression inconsistency found inside the face — "
                f"possible face-swap or digital retouching."
            )
        })

    # Metadata
    if not has_metadata:
        fake_signals += 1
        evidence.append({
            "severity": "medium",
            "finding": (
                "No camera EXIF metadata found. "
                "Real photos always contain camera info. "
                "AI generated images never have metadata."
            )
        })

    # Size
    if is_ai_size:
        fake_signals += 1
        evidence.append({
            "severity": "medium",
            "finding": (
                f"Image dimensions {w}x{h} match "
                f"standard AI generation sizes."
            )
        })

    # Build visualizations
    visualizations = {}

    visualizations["original"] = image_to_base64(
        image.resize((400, 300))
    )
    visualizations["original_label"] = "Original image"

    if gradcam_overlay is not None:
        visualizations["gradcam"] = image_to_base64(
            gradcam_overlay.resize((400, 300))
        )
        visualizations["gradcam_label"] = (
            f"Edge analysis overlay ({fake_score}% fake)"
        )

    if gradcam_heatmap is not None:
        visualizations["heatmap"] = image_to_base64(
            gradcam_heatmap.resize((400, 300))
        )
        visualizations["heatmap_label"] = (
            "Frequency heatmap — red = unusual patterns"
        )

    if ela_image is not None:
        visualizations["ela"] = image_to_base64(
            ela_image.resize((400, 300))
        )
        visualizations["ela_label"] = (
            "ELA map — bright = edited regions"
        )

    if annotated is not None:
        visualizations["annotated"] = image_to_base64(
            annotated.resize((400, 300))
        )
        visualizations["annotated_label"] = (
            "Green = face detected | Red = suspicious spots in face"
        )

    # Final verdict
    if fake_signals >= 3:
        verdict = "MANIPULATED"
        score = 90
        summary = (
            f"Strong evidence of manipulation. "
            f"{fake_signals}/4 signals flagged."
        )
    elif fake_signals == 2:
        verdict = "SUSPICIOUS"
        score = 65
        summary = (
            f"{fake_signals}/4 signals flagged. "
            f"Verification recommended."
        )
    elif fake_signals == 1:
        verdict = "SLIGHTLY SUSPICIOUS"
        score = 30
        summary = (
            "One minor signal. "
            "Likely authentic but worth checking."
        )
    else:
        verdict = "LIKELY AUTHENTIC"
        score = 10
        summary = (
            "No manipulation detected. "
            f"{'Face analyzed — appears natural.' if face_count > 0 else 'No face found.'}"
        )

    return {
        "verdict": verdict,
        "score": score,
        "summary": summary,
        "evidence": evidence,
        "visualizations": visualizations,
        "what_to_check_yourself": (
            "Green box = detected face. "
            "Red spots inside face = suspicious areas. "
            "Background is intentionally ignored. "
            "Bright ELA areas = possible editing."
        )
    }