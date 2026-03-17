import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
// Dashboard loaded
import "./index.css"

import { useState } from "react"
import ResultCard from "./components/ResultCard"

function TextDetect() {
  const [text, setText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!text.trim()) { alert("Paste some text first"); return }
    setLoading(true); setResult(null)
    const fd = new FormData(); fd.append("text", text)
    try { const r = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: fd }); setResult(await r.json()) }
    catch { alert("Backend not running") }
    finally { setLoading(false) }
  }
  const mod = result?.modules?.text
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: "#4488ff", marginBottom: 20 }}>Text Detector</h1>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste suspicious text here..." style={{ width: "100%", height: 180, padding: 14, background: "#111", border: "1px solid #222", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
      <button onClick={analyze} disabled={loading} style={{ width: "100%", padding: 14, marginTop: 12, background: loading ? "#333" : "linear-gradient(135deg,#4488ff,#0044cc)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        {loading ? "Analyzing..." : "Analyze Text"}
      </button>
      {mod && mod.verdict !== "SKIPPED" && (
        <div>
          <ResultCard result={mod} />
          {mod.writing_ai_score !== undefined && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              {[{ label: "AI WRITTEN", value: mod.writing_ai_score }, { label: "FALSE FACTS", value: mod.fact_score }].map(item => (
                <div key={item.label} style={{ padding: 20, background: "#111", border: "1px solid #222", borderRadius: 12 }}>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: item.value > 65 ? "#ff4444" : "#44bb66" }}>{item.value}%</div>
                </div>
              ))}
            </div>
          )}
          {mod.fact_check && (
            <div style={{ marginTop: 16, padding: 16, background: "#111", border: "1px solid #222", borderRadius: 12 }}>
              {mod.fact_check.verified?.length > 0 && <div style={{ color: "#44bb66", marginBottom: 8, fontSize: 13 }}>✓ Verified: {mod.fact_check.verified.join(", ")}</div>}
              {mod.fact_check.unverified?.length > 0 && <div style={{ color: "#ff6644", marginBottom: 8, fontSize: 13 }}>✕ Cannot verify: {mod.fact_check.unverified.join(", ")}</div>}
              {mod.fact_check.date_errors?.map((e, i) => <div key={i} style={{ color: "#ff6644", marginBottom: 8, fontSize: 13 }}>✕ {e}</div>)}
              {mod.fact_check.impossible_claims?.map((c, i) => <div key={i} style={{ color: "#ff8844", marginBottom: 8, fontSize: 13 }}>⚠ {c}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ImageDetect() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const analyze = async () => {
    if (!file) { alert("Upload an image"); return }
    setLoading(true); setResult(null)
    const fd = new FormData(); fd.append("file", file)
    try {
  const r = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: fd })
  const data = await r.json()
  setResult(data)
} catch(e) {
  alert("Error: " + e.message)
}
  }
  const mod = result?.modules?.image
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: "#ff6644", marginBottom: 20 }}>Image Detector</h1>
      <label style={{ display: "block", padding: 40, border: file ? "1px solid #ff664488" : "1px dashed #333", borderRadius: 16, textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
        {file ? <span style={{ color: "#ff6644" }}>✅ {file.name}</span> : <span style={{ color: "#666" }}>Click to upload image</span>}
        <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) { setFile(e.target.files[0]); setResult(null) } }} style={{ display: "none" }} />
      </label>
      {file && <button onClick={analyze} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#333" : "linear-gradient(135deg,#ff6644,#cc2200)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>{loading ? "Analyzing..." : "Analyze Image"}</button>}
      {mod && mod.verdict !== "SKIPPED" && (
        <div>
          <ResultCard result={mod} />
          {mod.visualizations && (
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {["original","gradcam","heatmap","ela","annotated"].map(key => mod.visualizations[key] && (
                <div key={key} style={{ border: "1px solid #222", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px", fontSize: 9, color: "#555" }}>{mod.visualizations[key + "_label"]}</div>
                  <img src={"data:image/png;base64," + mod.visualizations[key]} style={{ width: "100%", display: "block" }} alt={key} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AudioDetect() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const analyze = async () => {
    if (!file) { alert("Upload an audio file"); return }
    setLoading(true); setResult(null)
    const fd = new FormData(); fd.append("file", file)
    try { const r = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: fd }); setResult(await r.json()) }
    catch { alert("Backend not running") }
    finally { setLoading(false) }
  }
  const mod = result?.modules?.audio
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: "#ffaa00", marginBottom: 20 }}>Audio Detector</h1>
      <label style={{ display: "block", padding: 40, border: file ? "1px solid #ffaa0088" : "1px dashed #333", borderRadius: 16, textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
        {file ? <span style={{ color: "#ffaa00" }}>✅ {file.name}</span> : <span style={{ color: "#666" }}>Click to upload audio (MP3, WAV, M4A)</span>}
        <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" onChange={e => { if (e.target.files[0]) { setFile(e.target.files[0]); setResult(null) } }} style={{ display: "none" }} />
      </label>
      {file && <button onClick={analyze} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#333" : "linear-gradient(135deg,#ffaa00,#cc7700)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>{loading ? "Analyzing..." : "Analyze Audio"}</button>}
      {mod && mod.verdict !== "SKIPPED" && (
        <div>
          <ResultCard result={mod} />
          {mod.transcript && <div style={{ marginTop: 16, padding: 16, background: "#111", border: "1px solid #222", borderRadius: 12, color: "#aaa", fontSize: 14, fontStyle: "italic" }}>"{mod.transcript}"</div>}
        </div>
      )}
    </div>
  )
}

function VideoDetect() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const analyze = async () => {
    if (!file) { alert("Upload a video"); return }
    setLoading(true); setResult(null)
    const fd = new FormData(); fd.append("file", file)
    try { const r = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: fd }); setResult(await r.json()) }
    catch { alert("Backend not running") }
    finally { setLoading(false) }
  }
  const mod = result?.modules?.video
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ color: "#44bb66", marginBottom: 20 }}>Video Detector</h1>
      <label style={{ display: "block", padding: 40, border: file ? "1px solid #44bb6688" : "1px dashed #333", borderRadius: 16, textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
        {file ? <span style={{ color: "#44bb66" }}>✅ {file.name}</span> : <span style={{ color: "#666" }}>Click to upload video (MP4, MOV, AVI)</span>}
        <input type="file" accept="video/*,.mp4,.mov,.avi,.mkv" onChange={e => { if (e.target.files[0]) { setFile(e.target.files[0]); setResult(null) } }} style={{ display: "none" }} />
      </label>
      {file && <button onClick={analyze} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#333" : "linear-gradient(135deg,#44bb66,#006633)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>{loading ? "Analyzing video... (30-60 sec)" : "Analyze Video"}</button>}
      {mod && mod.verdict !== "SKIPPED" && (
        <div>
          <ResultCard result={mod} />
          {mod.emotion_data?.unique_emotions && (
            <div style={{ marginTop: 16, padding: 16, background: "#111", border: "1px solid #222", borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>EMOTIONS DETECTED</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {mod.emotion_data.unique_emotions.map((em, i) => (
                  <span key={i} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, background: "rgba(68,200,120,0.1)", color: "#44dd88", border: "1px solid rgba(68,200,120,0.3)" }}>{em}</span>
                ))}
              </div>
            </div>
          )}
          {mod.transcript && <div style={{ marginTop: 16, padding: 16, background: "#111", border: "1px solid #222", borderRadius: 12, color: "#aaa", fontSize: 14, fontStyle: "italic" }}>"{mod.transcript}"</div>}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/detect/text" element={<TextDetect />} />
        <Route path="/detect/image" element={<ImageDetect />} />
        <Route path="/detect/audio" element={<AudioDetect />} />
        <Route path="/detect/video" element={<VideoDetect />} />
      </Routes>
    </BrowserRouter>
  )
}