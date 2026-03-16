from PIL import Image
import numpy as np
import cv2
import os

print("Image detection module ready.")


def run_ela(image_path, quality=75):
    try:
        original = Image.open(image_path).convert("RGB")
        compressed_path = image_path + "_temp.jpg"
        original.save(compressed_path, "JPEG", quality=quality)
        original_array = np.array(original, dtype=float)
        compressed_array = np.array(
            Image.open(compressed_path), dtype=float
        )
        diff = np.abs(original_array - compressed_array)
        ela_mean = float(np.mean(diff))
        os.unlink(compressed_path)
        return ela_mean
    except:
        return 0


def check_metadata(image_path):
    """
    Checks image metadata for suspicious signs.
    Real photos have camera metadata.
    Screenshots and AI images often don't.
    """
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        if exif_data is None:
            return False, "No camera metadata found"
        return True, "Camera metadata present"
    except:
        return False, "Could not read metadata"


def check_image_size_ratio(image_path):
    """
    AI generated images are usually perfect squares
    or standard ratios like 512x512, 1024x1024.
    Real photos have irregular dimensions.
    """
    try:
        img = Image.open(image_path)
        w, h = img.size
        # Common AI generation sizes
        ai_sizes = [
            (512, 512), (1024, 1024), (512, 768),
            (768, 512), (1024, 768), (768, 1024),
            (1024, 1024), (2048, 2048)
        ]
        if (w, h) in ai_sizes:
            return True
        # Perfect squares are suspicious
        if w == h and w in [256, 512, 768, 1024, 2048]:
            return True
        return False
    except:
        return False


def analyze_image(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        w, h = image.size
    except Exception as e:
        return {
            "verdict": "ERROR",
            "score": 0,
            "summary": f"Could not read image: {str(e)}",
            "evidence": [],
            "what_to_check_yourself": ""
        }

    # Run checks
    ela_score = run_ela(image_path)
    has_metadata, metadata_msg = check_metadata(image_path)
    is_ai_size = check_image_size_ratio(image_path)

    evidence = []
    fake_signals = 0

    # Check 1 — metadata
    if not has_metadata:
        fake_signals += 1
        evidence.append({
            "severity": "medium",
            "finding": (
                "No camera metadata (EXIF) found in this image. "
                "Real photos taken with a camera always contain "
                "metadata like camera model, timestamp, and GPS. "
                "Missing metadata suggests this image was generated, "
                "screenshotted, or stripped of information."
            )
        })
    else:
        evidence.append({
            "severity": "none",
            "finding": f"Camera metadata present — {metadata_msg}. "
                      f"Suggests this was taken with a real camera."
        })

    # Check 2 — AI standard size
    if is_ai_size:
        fake_signals += 1
        evidence.append({
            "severity": "medium",
            "finding": (
                f"Image dimensions are {w}x{h} pixels — "
                f"a standard AI generation size. "
                f"Real camera photos rarely have perfectly "
                f"round dimensions. This size is commonly "
                f"output by image generation tools like "
                f"Midjourney, DALL-E, and Stable Diffusion."
            )
        })

    # Check 3 — ELA only if very high
    if ela_score > 20:
        fake_signals += 1
        evidence.append({
            "severity": "high",
            "finding": (
                f"Error Level Analysis shows significant "
                f"compression inconsistency (score: {round(ela_score, 1)}). "
                f"Large regions of this image appear to have been "
                f"edited and resaved at different quality levels."
            )
        })

    # Final verdict
    if fake_signals >= 2:
        verdict = "SUSPICIOUS"
        score = 70
        summary = (
            f"{fake_signals} suspicious signals detected. "
            f"This image shows signs of being AI-generated "
            f"or manipulated."
        )
    elif fake_signals == 1:
        verdict = "SLIGHTLY SUSPICIOUS"
        score = 30
        summary = (
            f"One minor suspicious signal detected. "
            f"Could be natural — recommend manual verification."
        )
    else:
        verdict = "LIKELY AUTHENTIC"
        score = 10
        summary = (
            "Image passes basic forensic checks. "
            "Camera metadata present and dimensions are natural. "
            "No significant editing artifacts detected."
        )

    return {
        "verdict": verdict,
        "score": score,
        "summary": summary,
        "evidence": evidence,
        "what_to_check_yourself": (
            "Check if image has metadata using Jeffrey's Exif Viewer online. "
            "Zoom into hair edges and skin boundaries. "
            "Look for blurring at the edges of faces."
        )
    }
