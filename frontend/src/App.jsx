import { useState } from "react"

export default function App() {
  const [text, setText] = useState("")
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!text && !file) {
      alert("Please paste text or upload a file first")
      return
    }
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    if (text) formData.append("text", text)
    if (file) formData.append("file", file)
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      alert("Cannot connect to backend.")
    } finally {
      setLoading(false)
    }
  }

  const isFake =
    result?.overall_verdict?.includes("FAKE") ||
    result?.overall_verdict?.includes("MANIPULATED") ||
    result?.overall_verdict?.includes("SUSPICIOUS")

  return (
    <div style={{
      maxWidth: 760, margin: "0 auto",
      padding: "32px 20px",
      fontFamily: "Arial, sans-serif",
      background: "#0d0d0d",
      minHeight: "100vh", color: "#f0f0f0"
    }}>

      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center",
          gap: 10, marginBottom: 6
        }}>
          <div style={{
            width: 12, height: 12,
            borderRadius: "50%", background: "#ff4444"
          }} />
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
            TruthLens
          </h1>
        </div>
        <p style={{ color: "#888", margin: 0, fontSize: 14 }}>
          Multimodal AI fake content detector
        </p>
      </div>

      <div style={{
        background: "#1a1a1a", borderRadius: 12,
        padding: 24, marginBottom: 20,
        border: "1px solid #2a2a2a"
      }}>
        <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
          Paste text or article
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste any news article or suspicious text here..."
          style={{
            width: "100%", height: 120, padding: 12,
            background: "#111", border: "1px solid #333",
            borderRadius: 8, color: "#f0f0f0",
            fontSize: 13, resize: "vertical", outline: "none"
          }}
        />
        <p style={{ fontWeight: 600, margin: "16px 0 8px", fontSize: 14 }}>
          Or upload a file
        </p>
        <label style={{
          display: "block", padding: 20,
          border: "2px dashed #333", borderRadius: 10,
          textAlign: "center", cursor: "pointer",
          color: "#666", fontSize: 13, marginBottom: 16
        }}>
          {file ? "✅ " + file.name : "Click to upload image, audio, or video"}
          <input type="file" accept="image/*,audio/*,video/*"
            onChange={e => setFile(e.target.files[0])}
            style={{ display: "none" }} />
        </label>
        <button onClick={analyze} disabled={loading}
          style={{
            width: "100%", padding: 14,
            background: loading ? "#333" : "#fff",
            color: loading ? "#666" : "#000",
            border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer"
          }}>
          {loading ? "Analyzing... please wait..." : "Analyze This Content"}
        </button>
      </div>

      {loading && (
        <div style={{
          background: "#1a1a1a", borderRadius: 12,
          padding: 24, textAlign: "center",
          border: "1px solid #2a2a2a", marginBottom: 20,
          color: "#888", fontSize: 13
        }}>
          Running all detection modules...
        </div>
      )}

      {result && (
        <div>
          <div style={{
            padding: 20, borderRadius: 12, marginBottom: 16,
            background: isFake ? "#1a0000" : "#001a08",
            border: "2px solid " + (isFake ? "#ff4444" : "#44bb66")
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  color: isFake ? "#ff4444" : "#44bb66",
                  marginBottom: 4
                }}>
                  {result.overall_verdict}
                </div>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 10 }}>
                  Manipulation probability: {result.overall_score}%
                </div>
                {result.plain_explanation && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 8, fontSize: 13,
                    color: "#ddd", lineHeight: 1.7,
                    fontStyle: "italic",
                    borderLeft: "3px solid " + (isFake ? "#ff4444" : "#44bb66")
                  }}>
                    {result.plain_explanation}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 40, fontWeight: 700, marginLeft: 16,
                color: isFake ? "#ff4444" : "#44bb66"
              }}>
                {isFake ? "✕" : "✓"}
              </div>
            </div>
          </div>

          {result.inconsistencies?.length > 0 && (
            <div style={{
              background: "#1a1200", border: "1px solid #ffaa00",
              borderRadius: 10, padding: 16, marginBottom: 16
            }}>
              <div style={{
                fontWeight: 600, color: "#ffaa00",
                marginBottom: 10, fontSize: 13
              }}>
                Cross-modal contradictions detected
              </div>
              {result.inconsistencies.map((item, i) => (
                <div key={i} style={{
                  padding: "8px 0",
                  borderTop: i > 0 ? "1px solid #2a2000" : "none",
                  fontSize: 13, color: "#ccaa44", lineHeight: 1.6
                }}>
                  {item.message}
                </div>
              ))}
            </div>
          )}

          <div style={{
            fontWeight: 600, marginBottom: 12,
            fontSize: 14, color: "#aaa"
          }}>
            Evidence by modality
          </div>

          {Object.entries(result.modules).map(([type, mod]) => {
            if (!mod || mod.verdict === "SKIPPED") return null

            const modFake = [
              "MANIPULATED", "AI GENERATED / SUSPICIOUS",
              "AI GENERATED FAKE NEWS", "FAKE NEWS — HUMAN WRITTEN",
              "AI GENERATED — VERIFY FACTS", "SYNTHETIC VOICE",
              "MANIPULATED VIDEO", "SUSPICIOUS", "SUSPICIOUS VIDEO"
            ].includes(mod.verdict)

            return (
              <div key={type} style={{
                background: "#1a1a1a", borderRadius: 10,
                padding: 16, marginBottom: 10,
                border: "1px solid #2a2a2a"
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  marginBottom: 8, alignItems: "center"
                }}>
                  <span style={{
                    fontWeight: 700, textTransform: "uppercase",
                    fontSize: 12, color: "#666", letterSpacing: 1
                  }}>
                    {type} module
                  </span>
                  <span style={{
                    color: modFake ? "#ff4444" : "#44bb66",
                    fontWeight: 600, fontSize: 12
                  }}>
                    {mod.verdict}
                  </span>
                </div>

                <div style={{
                  height: 4, background: "#222",
                  borderRadius: 2, marginBottom: 10, overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: mod.score + "%",
                    background: mod.score > 60 ? "#ff4444" : "#44bb66",
                    transition: "width 1s ease"
                  }} />
                </div>

                <p style={{
                  color: "#aaa", fontSize: 13,
                  lineHeight: 1.6, marginBottom: 10
                }}>
                  {mod.summary}
                </p>

                {type === "text" && mod.writing_ai_score !== undefined && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{
                      flex: 1, background: "#111",
                      borderRadius: 8, padding: "8px 12px"
                    }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                        AI WRITTEN
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 700,
                        color: mod.writing_ai_score > 70 ? "#ff4444" : "#44bb66"
                      }}>
                        {mod.writing_ai_score}%
                      </div>
                    </div>
                    <div style={{
                      flex: 1, background: "#111",
                      borderRadius: 8, padding: "8px 12px"
                    }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                        FALSE FACTS
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 700,
                        color: mod.fact_score > 60 ? "#ff4444" : "#44bb66"
                      }}>
                        {mod.fact_score}%
                      </div>
                    </div>
                  </div>
                )}

                {type === "text" && mod.fact_check && (
                  <div style={{ marginBottom: 10 }}>
                    {mod.fact_check.verified?.length > 0 && (
                      <div style={{
                        background: "#001a08",
                        borderLeft: "3px solid #44bb66",
                        padding: "8px 12px", marginBottom: 6,
                        fontSize: 12, borderRadius: "0 6px 6px 0",
                        color: "#44bb66"
                      }}>
                        Verified: {mod.fact_check.verified.join(", ")}
                      </div>
                    )}
                    {mod.fact_check.unverified?.length > 0 && (
                      <div style={{
                        background: "#1a0000",
                        borderLeft: "3px solid #ff4444",
                        padding: "8px 12px", marginBottom: 6,
                        fontSize: 12, borderRadius: "0 6px 6px 0",
                        color: "#ff4444"
                      }}>
                        Cannot verify: {mod.fact_check.unverified.join(", ")}
                      </div>
                    )}
                    {mod.fact_check.date_errors?.length > 0 && (
                      <div style={{
                        background: "#1a0000",
                        borderLeft: "3px solid #ff4444",
                        padding: "8px 12px", marginBottom: 6,
                        fontSize: 12, borderRadius: "0 6px 6px 0",
                        color: "#ff4444"
                      }}>
                        Date error: {mod.fact_check.date_errors[0]}
                      </div>
                    )}
                    {mod.fact_check.impossible_claims?.length > 0 && (
                      <div style={{
                        background: "#1a0600",
                        borderLeft: "3px solid #ff6600",
                        padding: "8px 12px", marginBottom: 6,
                        fontSize: 12, borderRadius: "0 6px 6px 0",
                        color: "#ff8844"
                      }}>
                        Suspicious claim: {mod.fact_check.impossible_claims[0]}
                      </div>
                    )}
                  </div>
                )}

                {mod.evidence?.map((ev, i) => (
                  ev.severity !== "none" && (
                    <div key={i} style={{
                      background: ev.severity === "high" ? "#1a0000" : "#1a1200",
                      borderLeft: "3px solid " + (ev.severity === "high" ? "#ff4444" : "#ffaa00"),
                      padding: "8px 12px", marginBottom: 6,
                      fontSize: 12, borderRadius: "0 6px 6px 0",
                      lineHeight: 1.6, color: "#ccc"
                    }}>
                      {ev.finding}
                    </div>
                  )
                ))}

                {type === "image" && mod.visualizations && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{
                      fontSize: 12, color: "#888", marginBottom: 10,
                      fontWeight: 600, textTransform: "uppercase"
                    }}>
                      Forensic Visualizations
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr", gap: 10
                    }}>
                      {["original", "gradcam", "heatmap", "ela", "annotated"].map(key => (
                        mod.visualizations[key] && (
                          <div key={key}>
                            <div style={{
                              fontSize: 10, color: "#666",
                              marginBottom: 4, textAlign: "center"
                            }}>
                              {mod.visualizations[key + "_label"]}
                            </div>
                            <img
                              src={"data:image/png;base64," + mod.visualizations[key]}
                              style={{
                                width: "100%", borderRadius: 6,
                                border: "1px solid #333"
                              }}
                              alt={key}
                            />
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {type === "video" && mod.emotion_data && (
                  <div style={{
                    marginTop: 12, padding: 12,
                    background: "#111", borderRadius: 8
                  }}>
                    <div style={{
                      fontSize: 11, color: "#888", marginBottom: 8,
                      fontWeight: 600, textTransform: "uppercase"
                    }}>
                      Emotion Analysis
                    </div>
                    <div style={{
                      display: "flex", gap: 6,
                      flexWrap: "wrap", marginBottom: 8
                    }}>
                      {mod.emotion_data.unique_emotions?.map((em, i) => (
                        <span key={i} style={{
                          padding: "3px 10px", borderRadius: 20,
                          fontSize: 11, fontWeight: 600,
                          background: em === "neutral" ? "#222" : "#1a2a00",
                          color: em === "neutral" ? "#888" : "#88ff44",
                          border: "1px solid " + (em === "neutral" ? "#333" : "#44aa00")
                        }}>
                          {em}
                        </span>
                      ))}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: mod.emotion_data.fake_score > 50 ? "#ff6644" : "#44bb66"
                    }}>
                      {mod.emotion_data.fake_score > 50
                        ? "Suspicious emotion patterns detected"
                        : "Natural emotion variation detected"}
                    </div>
                    {mod.emotion_data.findings?.map((f, i) => (
                      <div key={i} style={{
                        marginTop: 6, fontSize: 12, color: "#aaa",
                        padding: "6px 10px", background: "#1a1a1a",
                        borderRadius: 6, lineHeight: 1.5
                      }}>
                        {f}
                      </div>
                    ))}
                  </div>
                )}

                {mod.what_to_check_yourself && (
                  <div style={{
                    background: "#001020",
                    borderLeft: "3px solid #4488ff",
                    padding: "8px 12px", marginTop: 10,
                    fontSize: 12, borderRadius: "0 6px 6px 0",
                    color: "#88aaff", lineHeight: 1.6
                  }}>
                    Verify yourself: {mod.what_to_check_yourself}
                  </div>
                )}

                {mod.transcript && (
                  <p style={{
                    color: "#666", fontSize: 12,
                    marginTop: 8, fontStyle: "italic"
                  }}>
                    Transcript: "{mod.transcript}"
                  </p>
                )}

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}