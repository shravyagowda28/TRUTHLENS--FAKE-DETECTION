import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Choose Detection Type</h1>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 40 }}>Select a modality to analyze your content</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        <button onClick={() => navigate("/detect/text")}
          style={{ padding: 28, background: "rgba(68,136,255,0.05)", border: "2px solid #4488ff44", borderRadius: 20, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#4488ff", marginBottom: 8 }}>Text Detector</div>
          <p style={{ color: "#666", fontSize: 13 }}>Detects AI-written content, fake names, date errors.</p>
        </button>

        <button onClick={() => navigate("/detect/image")}
          style={{ padding: 28, background: "rgba(255,100,68,0.05)", border: "2px solid #ff664444", borderRadius: 20, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🖼️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ff6644", marginBottom: 8 }}>Image Detector</div>
          <p style={{ color: "#666", fontSize: 13 }}>ELA forensics, Grad-CAM heatmaps, face analysis.</p>
        </button>

        <button onClick={() => navigate("/detect/audio")}
          style={{ padding: 28, background: "rgba(255,170,0,0.05)", border: "2px solid #ffaa0044", borderRadius: 20, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎤</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffaa00", marginBottom: 8 }}>Audio Detector</div>
          <p style={{ color: "#666", fontSize: 13 }}>Voice clone detection, splice identification.</p>
        </button>

        <button onClick={() => navigate("/detect/video")}
          style={{ padding: 28, background: "rgba(68,187,102,0.05)", border: "2px solid #44bb6644", borderRadius: 20, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#44bb66", marginBottom: 8 }}>Video Detector</div>
          <p style={{ color: "#666", fontSize: 13 }}>Emotion AI, AI generation detection.</p>
        </button>

      </div>
    </div>
  )
}