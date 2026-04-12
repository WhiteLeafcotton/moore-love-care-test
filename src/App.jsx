import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const isHome = currentView === "home";

  // Consistent Button Style
  const buttonBaseStyle = {
    pointerEvents: "auto",
    padding: "14px 40px",
    border: "1px solid #2d1d3d",
    background: "#2d1d3d",
    color: "#f7ece8",
    borderRadius: "100px",
    fontSize: "10px",
    letterSpacing: "0.2em",
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "all 0.3s ease"
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7ece8", position: "relative", overflow: "hidden" }}>
      
      {/* UI OVERLAY */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10, 
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "50px 80px", // Increased padding for a more spacious feel
        pointerEvents: "none",
        transition: "opacity 0.8s ease-in-out, backdrop-filter 0.8s ease-in-out",
        opacity: isHome ? 1 : 0,

        background: isHome 
          ? "linear-gradient(to right, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%)" 
          : "transparent",
        backdropFilter: isHome ? "blur(5px) saturate(105%)" : "blur(0px)",
        WebkitBackdropFilter: isHome ? "blur(5px) saturate(105%)" : "blur(0px)",
        
        WebkitMaskImage: "linear-gradient(to right, black 30%, rgba(0, 0, 0, 0.4) 100%)",
        maskImage: "linear-gradient(to right, black 30%, rgba(0, 0, 0, 0.4) 100%)"
      }}>
        
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ 
            fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", 
            fontSize: "11px", color: "#2d1d3d" 
          }}>
            Moore Love & Care
          </div>
          <button style={{ ...buttonBaseStyle, background: "transparent", color: "#2d1d3d", padding: "10px 30px" }}>
            Inquiry
          </button>
        </header>

        {/* HERO SECTION - LARGER TITLE */}
        <main style={{ textAlign: "left", maxWidth: "900px" }}>
          <div style={{ 
            fontSize: "11px", letterSpacing: "0.6em", textTransform: "uppercase", 
            marginBottom: "20px", color: "rgba(45, 29, 61, 0.7)" 
          }}>
            THE SOLARIUM SANCTUARY
          </div>
          <h1 style={{
            /* Increased Title Scale */
            fontSize: "clamp(80px, 14vw, 160px)", 
            lineHeight: "0.8",
            color: "#2d1d3d", 
            fontWeight: 400, 
            margin: "0 0 50px 0", 
            fontFamily: "'Playfair Display', serif",
            letterSpacing: "-0.02em"
          }}>
            Moore Love <br /> & Care.
          </h1>
          <button
            onClick={() => setCurrentView("collection")}
            style={buttonBaseStyle}
          >
            Explore Collection
          </button>
        </main>

        {/* EXTENDED FOOTER - SOCIALS & INFO */}
        <footer style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr 1fr", 
          fontSize: "9px", 
          letterSpacing: "0.2em", 
          color: "#2d1d3d",
          textTransform: "uppercase",
          borderTop: "1px solid rgba(45, 29, 61, 0.1)",
          paddingTop: "30px"
        }}>
          <div style={{ display: "flex", gap: "25px" }}>
            <a href="#" style={{ pointerEvents: "auto", textDecoration: "none", color: "inherit", opacity: 0.6 }}>Instagram</a>
            <a href="#" style={{ pointerEvents: "auto", textDecoration: "none", color: "inherit", opacity: 0.6 }}>LinkedIn</a>
            <a href="#" style={{ pointerEvents: "auto", textDecoration: "none", color: "inherit", opacity: 0.6 }}>Vimeo</a>
          </div>
          
          <div style={{ textAlign: "center", opacity: 0.4 }}>
            Mental Restoration // Rehabilitation // Est. 2026
          </div>

          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ opacity: 0.6 }}>Moore Estates International</div>
            <div style={{ opacity: 0.3 }}>Privacy Policy // Terms of Service</div>
          </div>
        </footer>
      </div>

      {/* RETURN BUTTON - CONSISTENT STYLE */}
      {!isHome && (
        <button 
          onClick={() => setCurrentView("home")}
          style={{
            ...buttonBaseStyle,
            position: "absolute", bottom: "50px", left: "80px", zIindex: 20,
            padding: "12px 30px"
          }}
        >
          ← Return to Sanctuary
        </button>
      )}

      <Canvas shadows dpr={[1, 2]} camera={{ position: [-14, 3.2, 24], fov: 35 }}>
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}