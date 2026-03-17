# TruthLens — Multimodal AI Fake Content Detector

## Live Demo
Run locally following the instructions below.

## Problem Statement
Detecting fake content across text, images, audio and video using AI/ML.

## Features
- **Text Detection** — RoBERTa AI writing detector + fact checking + date error detection
- **Image Detection** — ELA forensics + Grad-CAM heatmaps + face analysis
- **Audio Detection** — Voice clone detection + splice points + Whisper transcription
- **Video Detection** — Emotion analysis + AI generation detection + cross-modal check
- **Plain English Explanation** — Every result explained in simple language
- **Cross-Modal Fusion** — Detects contradictions between modalities

## Tech Stack
- Backend: Python, FastAPI, HuggingFace Transformers, OpenCV, Whisper, DeepFace
- Frontend: React, Vite, React Router
- ML Models: RoBERTa, EfficientNet, Whisper, DeepFace

## How to Run

### Backend
```bash
cd backend
py -3.11 -m pip install -r requirements.txt
py -3.11 -m spacy download en_core_web_sm
py -3.11 -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Team
Built at state-level hackathon in 24 hours.

:
```
https://github.com/shravyagowda28/TRUTHLENS--FAKE-DETECTION
