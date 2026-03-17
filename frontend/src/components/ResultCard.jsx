export default function ResultCard({ result }) {
  if (!result || result.verdict === "SKIPPED") return null

  const isFake = [
    "MANIPULATED","AI GENERATED / SUSPICIOUS",
    "AI GENERATED FAKE NEWS","FAKE NEWS — HUMAN WRITTEN",
    "AI GENERATED — VERIFY FACTS","SYNTHETIC VOICE",
    "MANIPULATED VIDEO","AI GENERATED / MANIPULATED VIDEO",
    "SUSPICIOUS","SUSPICIOUS VIDEO"
  ].includes(result.verdict)

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: isFake ? "1px solid rgba(255,68,68,0.25)" : "1px solid rgba(68,187,102,0.25)",
      borderRadius: 16, padding: 20, marginTop: 20
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: isFake ? "#ff6644" : "#44bb66", marginBottom: 4, fontWeight: 700 }}>
            {isFake ? "⚠ FAKE DETECTED" : "✓ AUTHENTIC"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: isFake ? "#ff4444" : "#44bb66" }}>
            {result.verdict}
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: isFake ? "rgba(255,68,68,0.12)" : "rgba(68,187,102,0.12)",
          border: "2px solid " + (isFake ? "#ff4444" : "#44bb66"),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, color: isFake ? "#ff4444" : "#44bb66", fontWeight: 900
        }}>
          {isFake ? "✕" : "✓"}
        </div>
      </div>

      <div style={{ height: 5, background: "#111", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: result.score + "%",
          background: isFake ? "linear-gradient(90deg,#ff4444,#ff8800)" : "linear-gradient(90deg,#44bb66,#00ffaa)",
          borderRadius: 3, transition: "width 1.5s ease"
        }} />
      </div>

      <p style={{ color: "#777", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        {result.summary}
      </p>

      {result.evidence?.map((ev, i) => (
        ev.severity !== "none" && (
          <div key={i} style={{
            background: ev.severity === "high" ? "rgba(255,50,50,0.06)" : "rgba(255,170,0,0.06)",
            borderLeft: "2px solid " + (ev.severity === "high" ? "#ff4444" : "#ffaa00"),
            padding: "8px 12px", marginBottom: 6,
            fontSize: 12, borderRadius: "0 8px 8px 0",
            lineHeight: 1.6, color: "#bbb"
          }}>
            {ev.finding}
          </div>
        )
      ))}

      {result.what_to_check_yourself && (
        <div style={{
          background: "rgba(68,136,255,0.06)",
          borderLeft: "2px solid #4488ff",
          padding: "8px 12px", marginTop: 10,
          fontSize: 12, borderRadius: "0 8px 8px 0",
          color: "#88aaff", lineHeight: 1.6
        }}>
          Verify yourself: {result.what_to_check_yourself}
        </div>
      )}
    </div>
  )
}