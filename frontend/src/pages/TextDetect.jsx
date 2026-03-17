import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function TextDetect() {
  const [text, setText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const analyze = async () => {
    if (!text.trim()) { alert("Paste some text first"); return }
    setLoading(true); setResult(null)
    const fd = new FormData()
    fd.append("text", text)
    try {
      const r = await fetch("http://127.0.0.1:8000/analyze", { method: "POST", body: fd })
      setResult(await r.json())
    } catch { alert("Backend not running") }
    finally { setLoading(false) }
  }

  const mod = result?.modules?.text

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={() => navigate("/dashboard")}
        style={{ background: "transparent", border: "1px solid #222", color: "#666", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, marginBottom: 28, fontFamily: "inherit" }}>
        ← Dashboard
      </button>

      <h1 style={{ color: "#4488ff", marginBottom: 20 }}>Text Detector</h1>

      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Paste any news article, social media post, or suspicious text here..."
        style={{ width: "100%", height: 200, padding: 14, background: "#111", border: "1px solid #222", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.7 }} />

      <button onClick={analyze} disabled={loading}
        style={{ width: "100%", padding: 14, marginTop: 12, background: loading ? "#333" : "linear-gradient(135deg,#4488ff,#0044cc)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {loading ? "Analyzing..." : "Analyze Text"}
      </button>

      {loading && (
        <div style={{ textAlign: "center", padding: 24, color: "#666", fontSize: 13, marginTop: 16 }}>
          Analyzing text...
        </div>
      )}

      {mod && mod.verdict !== "SKIPPED" && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            padding: 20, borderRadius: 16,
            background: ["AI GENERATED FAKE NEWS","FAKE NEWS — HUMAN WRITTEN","AI GENERATED — VERIFY FACTS"].includes(mod.verdict) ? "rgba(255,30,30,0.08)" : "rgba(30,255,100,0.06)",
            border: ["AI GENERATED FAKE NEWS","FAKE NEWS — HUMAN WRITTEN","AI GENERATED — VERIFY FACTS"].includes(mod.verdict) ? "1px solid rgba(255,68,68,0.4)" : "1px solid rgba(68,187,102,0.4)",
            marginBottom: 16
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: ["AI GENERATED FAKE NEWS","FAKE NEWS — HUMAN WRITTEN","AI GENERATED — VERIFY FACTS"].includes(mod.verdict) ? "#ff4444" : "#44bb66", marginBottom: 6 }}>
              {mod.verdict}
            </div>
            <div style={{ color: "#777", fontSize: 13 }}>{mod.summary}</div>
          </div>

          {mod.writing_ai_score !== undefined && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "AI WRITTEN", value: mod.writing_ai_score },
                { label: "FALSE FACTS", value: mod.fact_score }
              ].map(item => (
                <div key={item.label} style={{ padding: 20, background: "#111", border: "1px solid #222", borderRadius: 12 }}>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 8, letterSpacing: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: item.value > 65 ? "#ff4444" : "#44bb66" }}>{item.value}%</div>
                  <div style={{ height: 4, background: "#222", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: item.value + "%", background: item.value > 65 ? "#ff4444" : "#44bb66", borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {mod.fact_check && (
            <div style={{ padding: 16, background: "#111", border: "1px solid #222", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>FACT CHECK</div>
              {mod.fact_check.verified?.length > 0 && (
                <div style={{ color: "#44bb66", marginBottom: 8, fontSize: 13, padding: "8px 12px", background: "rgba(68,187,102,0.06)", borderRadius: 8, borderLeft: "3px solid #44bb66" }}>
                  ✓ Verified names: {mod.fact_check.verified.join(", ")}
                </div>
              )}
              {mod.fact_check.unverified?.length > 0 && (
                <div style={{ color: "#ff6644", marginBottom: 8, fontSize: 13, padding: "8px 12px", background: "rgba(255,68,68,0.06)", borderRadius: 8, borderLeft: "3px solid #ff4444" }}>
                  ✕ Cannot verify: {mod.fact_check.unverified.join(", ")}
                </div>
              )}
              {mod.fact_check.date_errors?.map((e, i) => (
                <div key={i} style={{ color: "#ff6644", marginBottom: 8, fontSize: 13, padding: "8px 12px", background: "rgba(255,68,68,0.06)", borderRadius: 8, borderLeft: "3px solid #ff4444" }}>
                  ✕ Date error: {e}
                </div>
              ))}
              {mod.fact_check.impossible_claims?.map((c, i) => (
                <div key={i} style={{ color: "#ff8844", marginBottom: 8, fontSize: 13, padding: "8px 12px", background: "rgba(255,100,0,0.06)", borderRadius: 8, borderLeft: "3px solid #ff6600" }}>
                  ⚠ {c}
                </div>
              ))}
            </div>
          )}

          {mod.evidence?.map((ev, i) => (
            ev.severity !== "none" && (
              <div key={i} style={{ background: ev.severity === "high" ? "rgba(255,50,50,0.06)" : "rgba(255,170,0,0.06)", borderLeft: "2px solid " + (ev.severity === "high" ? "#ff4444" : "#ffaa00"), padding: "8px 12px", marginBottom: 6, fontSize: 12, borderRadius: "0 8px 8px 0", color: "#bbb" }}>
                {ev.finding}
              </div>
            )
          ))}

          {result?.plain_explanation && (
            <div style={{ marginTop: 16, padding: "16px 18px", background: "rgba(68,136,255,0.05)", border: "1px solid rgba(68,136,255,0.2)", borderRadius: 12, fontSize: 14, color: "#ccc", lineHeight: 1.8, fontStyle: "italic" }}>
              {result.plain_explanation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}