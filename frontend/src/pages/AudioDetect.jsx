import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import ResultCard from "../components/ResultCard"

export default function AudioDetect() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef()

  const analyze = async () => {
    if (!file) { alert("Please upload an audio file"); return }
    setLoading(true); setResult(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: formData })
      setResult(await res.json())
    } catch (e) { alert("Cannot connect to backend.") }
    finally { setLoading(false) }
  }

  const mod = result?.modules?.audio

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={() => navigate("/dashboard")}
        style={{ background: "transparent", border: "1px solid #222", color: "#666", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, marginBottom: 28, fontFamily: "inherit" }}>
        ← Dashboard
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: "rgba(255,170,0,0.15)", border: "1px solid rgba(255,170,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#ffaa00" }}>A</div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 2 }}>Audio Detector</h1>
          <div style={{ fontSize: 12, color: "#555" }}>Voice Clone · Splice Detection · Breathing Analysis</div>
        </div>
      </div>

      <div onClick={() => inputRef.current.click()}
        style={{ border: file ? "1px solid rgba(255,170,0,0.4)" : "1px dashed #222", borderRadius: 16, padding: 48, textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)", marginBottom: 20 }}>
        <input ref={inputRef} type="file" accept="audio/*"
          onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]) }}
          style={{ display: "none" }} />
        {file ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎵</div>
            <div style={{ color: "#ffaa00", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{file.name}</div>
            <div style={{ color: "#555", fontSize: 12, marginBottom: 16 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            <audio controls style={{ width: "100%", borderRadius: 8 }}>
              <source src={URL.createObjectURL(file)} />
            </audio>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎤</div>
            <div style={{ color: "#666", fontSize: 15, marginBottom: 6 }}>Drop audio file or click to browse</div>
            <div style={{ color: "#444", fontSize: 12 }}>MP3 · WAV · M4A · OGG</div>
          </div>
        )}
      </div>

      {file && (
        <button onClick={analyze} disabled={loading}
          style={{ width: "100%", padding: 14, background: loading ? "#1a1a1a" : "linear-gradient(135deg,#ffaa00,#cc7700)", color: loading ? "#666" : "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 20 }}>
          {loading ? "Analyzing audio..." : "Analyze Audio"}
        </button>
      )}

      {loading && (
        <div style={{ padding: 24, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid #111", borderRadius: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎧</div>
          <div style={{ color: "#666", fontSize: 13 }}>Transcribing and analyzing audio...</div>
        </div>
      )}

      {mod && mod.verdict !== "SKIPPED" && (
        <div>
          <ResultCard result={mod} />
          {mod.transcript && (
            <div style={{ marginTop: 16, padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid #111", borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>TRANSCRIPT</div>
              <div style={{ fontSize: 14, color: "#aaa", lineHeight: 1.8, fontStyle: "italic" }}>
                "{mod.transcript}"
              </div>
            </div>
          )}
          {result?.plain_explanation && (
            <div style={{ marginTop: 16, padding: "16px 18px", background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: 12, fontSize: 14, color: "#ccc", lineHeight: 1.8, fontStyle: "italic" }}>
              {result.plain_explanation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}