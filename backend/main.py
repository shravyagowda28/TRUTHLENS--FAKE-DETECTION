from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, tempfile
from dotenv import load_dotenv
from modules.text_detector import analyze_text
from modules.image_detector import analyze_image
from modules.audio_detector import analyze_audio
from modules.video_detector import analyze_video
from modules.fusion import fuse_results
from explainer import generate_plain_explanation

load_dotenv()

app = FastAPI(title="TruthLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

SKIPPED = {
    "verdict": "SKIPPED",
    "score": 0,
    "summary": "Not provided",
    "evidence": []
}


@app.get("/")
def home():
    return {"message": "TruthLens API is running!"}


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(None),
    text: str = Form(None)
):
    text_result = SKIPPED.copy()
    image_result = SKIPPED.copy()
    audio_result = SKIPPED.copy()
    video_result = SKIPPED.copy()

    if text and text.strip():
        print("Analyzing text...")
        text_result = analyze_text(text)

    if file and file.filename:
        suffix = os.path.splitext(file.filename)[1].lower()
        with tempfile.NamedTemporaryFile(
            suffix=suffix, delete=False
        ) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        try:
            if suffix in [".jpg", ".jpeg", ".png", ".webp"]:
                print("Analyzing image...")
                image_result = analyze_image(tmp_path)
            elif suffix in [".mp3", ".wav", ".m4a", ".ogg"]:
                print("Analyzing audio...")
                audio_result = analyze_audio(tmp_path)
            elif suffix in [".mp4", ".mov", ".avi", ".mkv"]:
                print("Analyzing video...")
                video_result = analyze_video(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    print("Running fusion...")
    final = fuse_results(
        text_result, image_result,
        audio_result, video_result
    )

    try:
        final["plain_explanation"] = generate_plain_explanation(final)
    except Exception as e:
        print(f"Explainer error: {e}")
        final["plain_explanation"] = None

    return final