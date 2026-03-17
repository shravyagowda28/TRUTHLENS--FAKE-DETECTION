import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import ResultCard from "../components/ResultCard"

export default function VideoDetect() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef()

  const analyze = async () => {
    if (!file) { alert("Please upload a video"); return }
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST", body: formData
      })
      setResult(await res.json())
    } catch (e) {
      alert("Cannot connect to backend.")
    } finally {
      setLoading(false)
    }
  }

  const mod = result?.modules?.video

  return (
    <div style={{
      maxWidth: 900, margin: "0 auto", padding: "40px 20px"
    }}>
      <button onClick={() => navigate("/dashboard")}
        style={{
          background: "transparent", border: "1px solid #222",
          color: "#666", padding: "7px 14px", borderRadius: 8,
          cursor: "pointer", fontSize: 12, marginBottom: 28,
          fontFamily: "inherit"
        }}>
        Back to Dashboard
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 12,
          background: "rgba(68,187,102,0.15)",
          border: "1px solid rgba(68,187,102,0.35)",
          display: "flex", alignItems: "center",
          justifyContent: "center",
          fontSize: 22, fontWeight: 900, color: "#44bb66"
        }}>
          V
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 2 }}>
            Video Detector
          </h1>
          <div style={{ fontSize: 12, color: "#555" }}>
            Emotion AI · AI Generation · Audio Analysis
          </div>
        </div>
      </div>

      <div
        onClick={() => inputRef.current.click()}
        style={{
          border: file ? "1px solid rgba(68,187,102,0.4)" : "1px dashed #222",
          borderRadius: 16, padding: 48,
          textAlign: "center", cursor: "pointer",
          background: "rgba(255,255,255,0.02)", marginBottom: 20
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*,.mp4,.mov,.avi,.mkv"
          onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]) }}
          style={{ display: "none" }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ color: "#44bb66", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              {file.name}
            </div>
            <div style={{ color: "#555", fontSize: 12, marginBottom: 16 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <video controls style={{ width: "100%", borderRadius: 8, maxHeight: 240 }}>
              <source src={URL.createObjectURL(file)} />
            </video>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <div style={{ color: "#666", fontSize: 15, marginBottom: 6 }}>
              Drop video or click to browse
            </div>
            <div style={{ color: "#444", fontSize: 12 }}>
              MP4 · MOV · AVI · MKV
            </div>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            width: "100%", padding: 14,
            background: loading ? "#1a1a1a" : "linear-gradient(135deg,#44bb66,#006633)",
            color: loading ? "#666" : "#fff",
            border: "none", borderRadius: 12,
            fontSize: 14, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit", marginBottom: 20
          }}
        >
          {loading ? "Analyzing video..." : "Analyze Video"}
        </button>
      )}

      {loading && (
        <div style={{
          padding: 32, textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid #111", borderRadius: 16, marginBottom: 20
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔍</div>
          <div style={{ color: "#777", fontSize: 13, marginBottom: 20 }}>
            Analyzing video — this may take 30-60 seconds
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {["Extracting frames", "Emotion analysis", "Audio analysis", "AI detection"].map(s => (
              <div key={s} style={{
                padding: "6px 12px",
                background: "rgba(68,187,102,0.08)",
                border: "1px solid rgba(68,187,102,0.2)",
                borderRadius: 8, fontSize: 11, color: "#44bb66"
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {mod && mod.verdict !== "SKIPPED" && (
        <div>
          <ResultCard result={mod} />

          {mod.emotion_data && (
            <div style={{
              marginTop: 16, padding: 20,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #111", borderRadius: 12
            }}>
              <div style={{
                fontSize: 10, color: "#555",
                letterSpacing: 2, marginBottom: 12, fontWeight: 600
              }}>
                EMOTION ANALYSIS
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {mod.emotion_data.unique_emotions?.map((em, i) => (
                  <span key={i} style={{
                    padding: "6px 14px", borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                    background: em === "neutral"
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(68,200,120,0.1)",
                    color: em === "neutral" ? "#666" : "#44dd88",
                    border: "1px solid " + (em === "neutral"
                      ? "#222" : "rgba(68,200,120,0.3)")
                  }}>
                    {em}
                  </span>
                ))}
              </div>
              <div style={{
                fontSize: 13,
                color: mod.emotion_data.fake_score > 50 ? "#ff6644" : "#44bb66"
              }}>
                {mod.emotion_data.fake_score > 50
                  ? `Suspicious emotion patterns (${mod.emotion_data.fake_score}%)`
                  : "Natural emotion variation detected"}
              </div>
              {mod.emotion_data.findings?.map((f, i) => (
                <div key={i} style={{
                  marginTop: 8, fontSize: 12, color: "#777",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 8, lineHeight: 1.6
                }}>
                  {f}
                </div>
              ))}
            </div>
          )}

          {mod.transcript && (
            <div style={{
              marginTop: 16, padding: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #111", borderRadius: 12
            }}>
              <div style={{
                fontSize: 10, color: "#555",
                letterSpacing: 2, marginBottom: 10, fontWeight: 600
              }}>
                AUDIO TRANSCRIPT
              </div>
              <div style={{
                fontSize: 14, color: "#aaa",
                lineHeight: 1.8, fontStyle: "italic"
              }}>
                "{mod.transcript}"
              </div>
            </div>
          )}

          {result?.plain_explanation && (
            <div style={{
              marginTop: 16, padding: "16px 18px",
              background: "rgba(68,187,102,0.05)",
              border: "1px solid rgba(68,187,102,0.2)",
              borderRadius: 12, fontSize: 14,
              color: "#ccc", lineHeight: 1.8, fontStyle: "italic"
            }}>
              {result.plain_explanation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}