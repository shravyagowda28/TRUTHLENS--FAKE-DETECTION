import { useNavigate, useLocation } from "react-router-dom"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav style={{
      background: "rgba(4,4,16,0.97)",
      borderBottom: "1px solid #0f0f22",
      padding: "0 32px",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      height: 62,
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div onClick={() => navigate("/")}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 36, height: 36,
          background: "linear-gradient(135deg,#ff3c3c,#ff8c00)",
          borderRadius: 9, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 900, color: "#fff"
        }}>TL</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1 }}>TruthLens</div>
          <div style={{ fontSize: 9, color: "#444", letterSpacing: 3 }}>FAKE DETECTOR</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {[{ label: "Home", path: "/" }, { label: "Dashboard", path: "/dashboard" }].map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            style={{
              padding: "7px 18px",
              background: location.pathname === item.path ? "rgba(255,60,60,0.12)" : "transparent",
              border: location.pathname === item.path ? "1px solid rgba(255,60,60,0.35)" : "1px solid transparent",
              color: location.pathname === item.path ? "#ff6644" : "#666",
              borderRadius: 8, cursor: "pointer", fontSize: 13,
              fontWeight: 500, fontFamily: "inherit"
            }}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#444" }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#44ff88", boxShadow: "0 0 8px #44ff88"
        }} />
        LIVE
      </div>
    </nav>
  )
}