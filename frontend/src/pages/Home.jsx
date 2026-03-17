import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div>
      {/* Hero */}
      <div style={{
        minHeight: "calc(100vh - 62px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 20px",
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(255,60,60,0.07) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 70%, rgba(68,100,255,0.07) 0%, transparent 55%)
        `
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,60,60,0.08)",
          border: "1px solid rgba(255,60,60,0.25)",
          borderRadius: 20, padding: "8px 16px",
          fontSize: 11, color: "#ff6644",
          letterSpacing: 2, marginBottom: 32, fontWeight: 700
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#ff4444", boxShadow: "0 0 8px #ff4444"
          }} />
          AI/ML POWERED FAKE CONTENT DETECTION
        </div>

        <h1 style={{
          fontSize: 62, fontWeight: 900,
          textAlign: "center", lineHeight: 1.05,
          marginBottom: 20, maxWidth: 720
        }}>
          <span style={{
            background: "linear-gradient(135deg,#ffffff,#888888)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Detect Fake Content
          </span>
          <br />
          <span style={{
            background: "linear-gradient(135deg,#ff4444,#ff8800)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            With Forensic Proof
          </span>
        </h1>

        <p style={{
          color: "#666", fontSize: 17, textAlign: "center",
          maxWidth: 500, lineHeight: 1.75, marginBottom: 40
        }}>
          TruthLens analyzes text, images, audio and video
          simultaneously — giving you human-readable evidence,
          not just a percentage score.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 60 }}>
          <button onClick={() => navigate("/dashboard")}
            style={{
              padding: "14px 36px",
              background: "linear-gradient(135deg,#ff3c3c,#ff8c00)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 24px rgba(255,60,60,0.35)"
            }}>
            Start Detecting →
          </button>
          <button onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}
            style={{
              padding: "14px 36px", background: "transparent",
              color: "#888", border: "1px solid #222",
              borderRadius: 12, fontSize: 15,
              cursor: "pointer", fontFamily: "inherit"
            }}>
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 48, padding: "22px 48px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid #111", borderRadius: 16
        }}>
          {[
            { value: "4", label: "Modalities" },
            { value: "12+", label: "ML Techniques" },
            { value: "100%", label: "Explainable" },
            { value: "Real-time", label: "Detection" }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 26, fontWeight: 900,
                background: "linear-gradient(135deg,#ff4444,#ff8800)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#ff6644", letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>
            DETECTION MODULES
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 12 }}>
            Four AI Modules. One Verdict.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { icon: "T", color: "#4488ff", title: "Text Detection", desc: "RoBERTa NLP detects AI-written content. Fact checks named entities. Catches date errors and impossible claims.", tags: ["NLP", "Fact Check", "AI Detection"], path: "/detect/text" },
            { icon: "I", color: "#ff6644", title: "Image Forensics", desc: "ELA editing detection, Grad-CAM heatmaps, face-focused analysis with visual evidence panels.", tags: ["Deepfake", "ELA", "Grad-CAM"], path: "/detect/image" },
            { icon: "A", color: "#ffaa00", title: "Voice Analysis", desc: "Detects cloned voices, splice points, unnatural breathing using Whisper AI transcription.", tags: ["Voice Clone", "Whisper", "Splice"], path: "/detect/audio" },
            { icon: "V", color: "#44bb66", title: "Video Analysis", desc: "Emotion analysis frame by frame, AI generation detection, lip sync verification.", tags: ["DeepFace", "Emotion AI", "Temporal"], path: "/detect/video" }
          ].map((f, i) => (
            <div key={i}
              onClick={() => navigate(f.path)}
              style={{
                padding: 28,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #111",
                borderRadius: 18, cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = "1px solid " + f.color + "44"
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = "1px solid #111"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: f.color + "18",
                border: "1px solid " + f.color + "33",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 900, color: f.color, marginBottom: 16
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                {f.title}
              </div>
              <p style={{ color: "#666", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
                {f.desc}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {f.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 6,
                    background: f.color + "11", color: f.color,
                    border: "1px solid " + f.color + "33"
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 48, textAlign: "center", padding: 48,
          background: "linear-gradient(135deg,rgba(255,60,60,0.06),rgba(60,100,255,0.06))",
          border: "1px solid #1a1a2e", borderRadius: 20
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, color: "#fff" }}>
            Ready to detect fake content?
          </h2>
          <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
            Upload any text, image, audio or video and get forensic-grade analysis in seconds.
          </p>
          <button onClick={() => navigate("/dashboard")}
            style={{
              padding: "14px 40px",
              background: "linear-gradient(135deg,#ff3c3c,#ff8c00)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 24px rgba(255,60,60,0.3)"
            }}>
            Go to Dashboard →
          </button>
        </div>
      </div>

      <footer style={{
        borderTop: "1px solid #0f0f1a", padding: "24px 32px",
        textAlign: "center", color: "#333", fontSize: 12
      }}>
        TruthLens — Multimodal AI Fake Content Detection · Built for State Level Hackathon
      </footer>
    </div>
  )
}