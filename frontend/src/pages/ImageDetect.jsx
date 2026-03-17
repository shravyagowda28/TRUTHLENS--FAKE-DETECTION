import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import ResultCard from "../components/ResultCard"

export default function ImageDetect() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef()

  const handleFile = f => { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null) }

  const analyze = async () => {
    if (!file) { alert("Please upload an image"); return }
    setLoading(true); setResult(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: formData })
      setResult(await res.json())
    } catch (e) { alert("Cannot connect to backend.") }
    finally { setLoading(false) }
  }

  const mod = result?.modules?.image

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={() => navigate("/dashboard")}
        style={{ background: "transparent", border: "1px solid #222", color: "#666", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, marginBottom: 28, fontFamily: "inherit" }}>
        ← Dashboard
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: "rgba(255,100,68,0.15)", border: "1px solid rgba(255,100,68,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#ff6644" }}>I</div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 2 }}>Image Detector</h1>
          <div style={{ fontSize: 12, color: "#555" }}>Deepfake · ELA Forensics · Grad-CAM</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: preview ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 20 }}>
        <div onClick={() => inputRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{ border: file ? "1px solid rgba(255,100,68,0.4)" : "1px dashed #222", borderRadius: 16, padding: 40, textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
          <input ref={inputRef} type="file" accept="image/*"
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
            style={{ display: "none" }} />
          {file ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ color: "#ff6644", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{file.name}</div>
              <div style={{ color: "#555", fontSize: 11 }}>Click to change</div>
            </>
          ) : (
            <>
              <div style={{ width: 56, height: 56, border: "1px dashed #333", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16, color: "#444" }}>↑</div>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 6 }}>Drop image or click to browse</div>
              <div style={{ color: "#444", fontSize: 11 }}>JPG · PNG · WebP</div>
            </>
          )}
        </div>
        {preview && (
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #222", maxHeight: 260 }}>
            <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {file && (
        <button onClick={analyze} disabled={loading}
          style={{ width: "100%", padding: 14, background: loading ? "#1a1a1a" : "linear-gradient(135deg,#ff6644,#cc2200)", color: loading ? "#666" : "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 20 }}>
          {loading ? "Analyzing image..." : "Analyze Image"}
        </button>
      )}

      {loading && (
        <div style={{ padding: 24, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid #111", borderRadius: 16, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #111", borderTop: "3px solid #ff6644", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
          <div style={{ color: "#666", fontSize: 13 }}>Running forensic analysis...</div>
        </div>
      )}

      {mod && mod.verdict !== "SKIPPED" && (
        <div>
          <ResultCard result={mod} />
          {mod.visualizations && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 14, fontWeight: 600 }}>FORENSIC VISUALIZATIONS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {["original","gradcam","heatmap","ela","annotated"].map(key => (
                  mod.visualizations[key] && (
                    <div key={key} style={{ background: "rgba(255,255,255,0.02)", border: key === "annotated" || key === "gradcam" ? "1px solid rgba(255,68,68,0.3)" : "1px solid #111", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "6px 10px", fontSize: 9, color: "#555", letterSpacing: 1, fontWeight: 600 }}>
                        {mod.visualizations[key + "_label"]}
                      </div>
                      <img src={"data:image/png;base64," + mod.visualizations[key]} style={{ width: "100%", display: "block" }} alt={key} />
                    </div>
                  )
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 11, color: "#555", lineHeight: 1.8 }}>
                🔴 Grad-CAM = AI focus area &nbsp;|&nbsp; ⬜ ELA = edited regions &nbsp;|&nbsp; 🟩 Green = face &nbsp;|&nbsp; 🟥 Red = suspicious
              </div>
            </div>
          )}
          {result?.plain_explanation && (
            <div style={{ marginTop: 16, padding: "16px 18px", background: "rgba(255,100,68,0.05)", border: "1px solid rgba(255,100,68,0.2)", borderRadius: 12, fontSize: 14, color: "#ccc", lineHeight: 1.8, fontStyle: "italic" }}>
              {result.plain_explanation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}