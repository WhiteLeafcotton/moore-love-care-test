import { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css"; 

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isHome = currentView === "home";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7ece8", position: "relative", overflow: "hidden" }}>
      
      {/* UI OVERLAY (HOME VIEW) */}
      <div className={`ui-overlay ${!isHome ? 'fade-out' : ''}`}>
        
        {/* HEADER: Spaced for Status Bar/Notch */}
        <header style={{ 
          width: "100%", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          position: "absolute",
          top: "0",
          left: "0",
          padding: isMobile ? "calc(env(safe-area-inset-top) + 20px) 30px" : "50px 80px",
          boxSizing: "border-box",
          pointerEvents: "none"
        }}>
          <div style={{ fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", fontSize: isMobile ? "9px" : "11px", color: "#2d1d3d" }}>
            Moore Love & Care
          </div>
          <button style={{ 
            pointerEvents: "auto",
            background: "transparent", 
            border: "1px solid rgba(45,29,61,0.2)", 
            borderRadius: "100px",
            color: "#2d1d3d", 
            padding: isMobile ? "8px 20px" : "10px 30px", 
            fontSize: "8px", 
            textTransform: "uppercase", 
            letterSpacing: "0.1em"
          }}>
            Inquiry
          </button>
        </header>

        {/* HERO SECTION: Centered for Mobile */}
        <div style={{ pointerEvents: "none" }}>
          <div className="brand-subtitle">The Solarium Sanctuary</div>
          <h1 className="brand-title">
            Moore Love <br /> & Care.
          </h1>
          <button 
            className="explore-button" 
            onClick={() => setCurrentView("collection")} 
            style={{ marginTop: "40px", pointerEvents: "auto" }}
          >
            Explore Collection
          </button>
        </div>

        {/* FOOTER: Spaced for Home Indicator */}
        <footer style={{ 
          position: "absolute", 
          bottom: "0", 
          left: "0", 
          width: "100%",
          padding: isMobile ? "20px 30px calc(env(safe-area-inset-bottom) + 20px)" : "30px 80px",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", gap: "20px", color: "rgba(45, 29, 61, 0.5)", fontSize: "9px" }}>
            <span>FB</span>
            <span>IG</span>
          </div>
          <div style={{ fontSize: "8px", opacity: 0.4, letterSpacing: "0.1em" }}>
            EST. 2026 // MOORE ESTATES
          </div>
        </footer>
      </div>

      {/* UNDERWATER / COLLECTION VIEW */}
      <div className={`underwater-page ${!isHome ? 'active' : ''}`}>
        <div className="depth-layer hero">
          <h1>Submerged Grace</h1>
          <p>Mental Restoration // Rehabilitation</p>
        </div>
        
        <button 
          onClick={() => setCurrentView("home")}
          style={{
            position: "absolute", 
            bottom: "calc(env(safe-area-inset-bottom) + 40px)", 
            left: "50%", 
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white", 
            padding: "14px 40px", 
            borderRadius: "50px", 
            fontSize: "9px",
            letterSpacing: "0.2em", 
            pointerEvents: "auto", 
            cursor: "pointer",
            textTransform: "uppercase"
          }}
        >
          ← Return to Surface
        </button>
      </div>

      {/* 3D SCENE */}
      <Canvas shadows dpr={[1, 2]} camera={{ position: [-14, 3.2, 24], fov: 35 }}>
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}