import { useState } from "react"

export default function App() {
  const [text, setText] = useState("")
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("analyze")

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
      alert("Cannot connect to backend. Make sure it is running.")
    } finally {
      setLoading(false)
    }
  }

  const isFake = result?.overall_verdict?.includes("FAKE") ||
    result?.overall_verdict?.includes("MANIPULATED") ||
    result?.overall_verdict?.includes("SUSPICIOUS")

  return (
    <div style={{
      maxWidth: 720, margin: "0 auto",
      padding: "32px 20px",
      fontFamily: "Arial, sans-serif",
      background: "#0d0d0d",
      minHeight: "100vh",
      color: "#f0f0f0"
    }}>

      {/* Header */}
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
          Multimodal AI fake content detector — Text · Image · Audio · Video
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 24,
        borderBottom: "1px solid #222"
      }}>
        {["analyze", "about"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 18px", background: "none",
              border: "none",
              color: activeTab === tab ? "#fff" : "#666",
              borderBottom: activeTab === tab
                ? "2px solid #fff"
                : "2px solid transparent",
              cursor: "pointer", fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Analyze Tab */}
      {activeTab === "analyze" && (
        <div>
          {/* Input Card */}
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
              placeholder="Paste any news article, social media post, or suspicious text here..."
              style={{
                width: "100%", height: 120, padding: 12,
                background: "#111", border: "1px solid #333",
                borderRadius: 8, color: "#f0f0f0",
                fontSize: 13, resize: "vertical", outline: "none"
              }}
            />

            <p style={{
              fontWeight: 600,
              margin: "16px 0 8px", fontSize: 14
            }}>
              Or upload a file
            </p>
            <label style={{
              display: "block", padding: 20,
              border: "2px dashed #333", borderRadius: 10,
              textAlign: "center", cursor: "pointer",
              color: "#666", fontSize: 13, marginBottom: 16
            }}>
              {file ? `✅ ${file.name}` : "Click to upload image, audio, or video"}
              <input
                type="file"
                accept="image/*,audio/*,video/*"
                onChange={e => setFile(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>

            <button
              onClick={analyze}
              disabled={loading}
              style={{
                width: "100%", padding: 14,
                background: loading ? "#333" : "#fff",
                color: loading ? "#666" : "#000",
                border: "none", borderRadius: 8,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading
                ? "Analyzing... please wait..."
                : "Analyze This Content"}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{
              background: "#1a1a1a", borderRadius: 12,
              padding: 24, textAlign: "center",
              border: "1px solid #2a2a2a", marginBottom: 20
            }}>
              <div style={{
                fontSize: 13, color: "#888", marginBottom: 12
              }}>
                Running all detection modules...
              </div>
              <div style={{
                display: "flex", gap: 6,
                justifyContent: "center"
              }}>
                {["Text", "Image", "Audio", "Video", "Fusion"].map(m => (
                  <div key={m} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: "#333"
                  }} />
                ))}
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11, color: "#555", marginTop: 4
              }}>
                {["Text", "Image", "Audio", "Video", "Fusion"].map(m => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div>
              {/* Main verdict */}
              <div style={{
                padding: 20, borderRadius: 12, marginBottom: 16,
                background: isFake ? "#1a0000" : "#001a08",
                border: `2px solid ${isFake ? "#ff4444" : "#44bb66"}`
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{
                      fontSize: 20, fontWeight: 700,
                      color: isFake ? "#ff4444" : "#44bb66",
                      marginBottom: 4
                    }}>
                      {result.overall_verdict}
                    </div>
                    <div style={{ color: "#888", fontSize: 13 }}>
                      Manipulation probability: {result.overall_score}%
                    </div>
                  </div>
                  <div style={{
                    fontSize: 40, fontWeight: 700,
                    color: isFake ? "#ff4444" : "#44bb66"
                  }}>
                    {isFake ? "✕" : "✓"}
                  </div>
                </div>
              </div>

              {/* Cross modal inconsistencies */}
              {result.inconsistencies?.length > 0 && (
                <div style={{
                  background: "#1a1200",
                  border: "1px solid #ffaa00",
                  borderRadius: 10, padding: 16,
                  marginBottom: 16
                }}>
                  <div style={{
                    fontWeight: 600, color: "#ffaa00",
                    marginBottom: 10, fontSize: 13
                  }}>
                    ⚡ Cross-modal contradictions detected
                  </div>
                  {result.inconsistencies.map((item, i) => (
                    <div key={i} style={{
                      padding: "8px 0",
                      borderTop: i > 0
                        ? "1px solid #2a2000" : "none",
                      fontSize: 13, color: "#ccaa44",
                      lineHeight: 1.6
                    }}>
                      {item.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Module results */}
              <div style={{
                fontWeight: 600, marginBottom: 12,
                fontSize: 14, color: "#aaa"
              }}>
                Evidence by modality
              </div>

              {Object.entries(result.modules).map(([type, mod]) => {
                if (!mod || mod.verdict === "SKIPPED") return null

                const modFake = [
                  "MANIPULATED",
                  "AI GENERATED / SUSPICIOUS",
                  "AI GENERATED FAKE NEWS",
                  "FAKE NEWS — HUMAN WRITTEN",
                  "AI GENERATED — FACTS UNVERIFIED",
                  "SYNTHETIC VOICE",
                  "MANIPULATED VIDEO",
                  "SUSPICIOUS"
                ].includes(mod.verdict)

                return (
                  <div key={type} style={{
                    background: "#1a1a1a",
                    borderRadius: 10, padding: 16,
                    marginBottom: 10,
                    border: "1px solid #2a2a2a"
                  }}>
                    {/* Module header */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8, alignItems: "center"
                    }}>
                      <span style={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: 12, color: "#666",
                        letterSpacing: 1
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

                    {/* Score bar */}
                    <div style={{
                      height: 4, background: "#222",
                      borderRadius: 2, marginBottom: 10,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${mod.score}%`,
                        background: mod.score > 60
                          ? "#ff4444" : "#44bb66",
                        transition: "width 1s ease"
                      }} />
                    </div>

                    {/* Summary */}
                    <p style={{
                      color: "#aaa", fontSize: 13,
                      lineHeight: 1.6, marginBottom: 10
                    }}>
                      {mod.summary}
                    </p>

                    {/* Two dimension scores for text */}
                    {type === "text" &&
                      mod.writing_ai_score !== undefined && (
                        <div style={{
                          display: "flex", gap: 8,
                          marginBottom: 10
                        }}>
                          <div style={{
                            flex: 1, background: "#111",
                            borderRadius: 8,
                            padding: "8px 12px"
                          }}>
                            <div style={{
                              fontSize: 11,
                              color: "#666", marginBottom: 4
                            }}>
                              AI WRITTEN
                            </div>
                            <div style={{
                              fontSize: 18, fontWeight: 700,
                              color: mod.writing_ai_score > 70
                                ? "#ff4444" : "#44bb66"
                            }}>
                              {mod.writing_ai_score}%
                            </div>
                          </div>
                          <div style={{
                            flex: 1, background: "#111",
                            borderRadius: 8,
                            padding: "8px 12px"
                          }}>
                            <div style={{
                              fontSize: 11,
                              color: "#666", marginBottom: 4
                            }}>
                              FALSE FACTS
                            </div>
                            <div style={{
                              fontSize: 18, fontWeight: 700,
                              color: mod.fact_score > 60
                                ? "#ff4444" : "#44bb66"
                            }}>
                              {mod.fact_score}%
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Fact check results */}
                    {type === "text" && mod.fact_check && (
                      <div style={{ marginBottom: 10 }}>
                        {mod.fact_check.verified?.length > 0 && (
                          <div style={{
                            background: "#001a08",
                            borderLeft: "3px solid #44bb66",
                            padding: "8px 12px",
                            marginBottom: 6, fontSize: 12,
                            borderRadius: "0 6px 6px 0",
                            color: "#44bb66"
                          }}>
                            ✓ Verified: {mod.fact_check.verified.join(", ")}
                          </div>
                        )}
                        {mod.fact_check.unverified?.length > 0 && (
                          <div style={{
                            background: "#1a0000",
                            borderLeft: "3px solid #ff4444",
                            padding: "8px 12px",
                            marginBottom: 6, fontSize: 12,
                            borderRadius: "0 6px 6px 0",
                            color: "#ff4444"
                          }}>
                            ✕ Cannot verify: {mod.fact_check.unverified.join(", ")}
                          </div>
                        )}
                        {mod.fact_check.date_errors?.length > 0 && (
                          <div style={{
                            background: "#1a0000",
                            borderLeft: "3px solid #ff4444",
                            padding: "8px 12px",
                            marginBottom: 6, fontSize: 12,
                            borderRadius: "0 6px 6px 0",
                            color: "#ff4444"
                          }}>
                            ✕ Date error: {mod.fact_check.date_errors[0]}
                          </div>
                        )}
                        {mod.fact_check.impossible_claims?.length > 0 && (
                          <div style={{
                            background: "#1a0600",
                            borderLeft: "3px solid #ff6600",
                            padding: "8px 12px",
                            marginBottom: 6, fontSize: 12,
                            borderRadius: "0 6px 6px 0",
                            color: "#ff8844"
                          }}>
                            ⚠ Suspicious claim: {mod.fact_check.impossible_claims[0]}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evidence items */}
                    {mod.evidence?.map((ev, i) => (
                      ev.severity !== "none" && (
                        <div key={i} style={{
                          background: ev.severity === "high"
                            ? "#1a0000" : "#1a1200",
                          borderLeft: `3px solid ${ev.severity === "high"
                            ? "#ff4444" : "#ffaa00"}`,
                          padding: "8px 12px",
                          marginBottom: 6, fontSize: 12,
                          borderRadius: "0 6px 6px 0",
                          lineHeight: 1.6, color: "#ccc"
                        }}>
                          {ev.finding}
                        </div>
                      )
                    ))}

                    {/* Verify yourself */}
                    {mod.what_to_check_yourself && (
                      <div style={{
                        background: "#001020",
                        borderLeft: "3px solid #4488ff",
                        padding: "8px 12px", marginTop: 8,
                        fontSize: 12,
                        borderRadius: "0 6px 6px 0",
                        color: "#88aaff", lineHeight: 1.6
                      }}>
                        <strong>Verify yourself:</strong>{" "}
                        {mod.what_to_check_yourself}
                      </div>
                    )}

                    {/* Transcript */}
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
      )}

      {/* About Tab */}
      {activeTab === "about" && (
        <div style={{
          background: "#1a1a1a", borderRadius: 12,
          padding: 24, border: "1px solid #2a2a2a"
        }}>
          <h2 style={{ marginBottom: 16, fontSize: 18 }}>
            How TruthLens works
          </h2>
          {[
            {
              title: "Text Module — 2 dimensions",
              desc: "Checks both HOW it was written (AI vs human) and WHETHER the facts are true. Verifies named people and organisations against Wikipedia. Detects date errors and impossible claims."
            },
            {
              title: "Image Module",
              desc: "Uses Error Level Analysis to detect editing boundaries. Checks EXIF metadata — real photos have camera data, AI images don't. Analyses image dimensions for AI generation patterns."
            },
            {
              title: "Audio Module",
              desc: "OpenAI Whisper transcribes speech. Mel spectrogram analysis detects synthetic voice patterns. Detects unnatural breathing patterns and splice boundaries."
            },
            {
              title: "Video Module",
              desc: "Frame by frame deepfake detection. Audio extracted and analysed separately. Cross-modal verification between audio and video."
            },
            {
              title: "Fusion Engine — our unique feature",
              desc: "Detects contradictions between modalities. Real audio on a fake face. Human-written text accompanying a manipulated image. These cross-modal attacks fool single-modality detectors but not TruthLens."
            }
          ].map((item, i) => (
            <div key={i} style={{
              marginBottom: 16, paddingBottom: 16,
              borderBottom: i < 4 ? "1px solid #222" : "none"
            }}>
              <div style={{
                fontWeight: 600, marginBottom: 4,
                color: "#fff", fontSize: 14
              }}>
                {item.title}
              </div>
              <div style={{
                color: "#888", fontSize: 13, lineHeight: 1.6
              }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}