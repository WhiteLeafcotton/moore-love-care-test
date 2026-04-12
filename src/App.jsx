import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7ece8", position: "relative", overflow: "hidden" }}>
      
      {/* UI OVERLAY - Frosted Glass Container */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "40px 60px",
        backdropFilter: "blur(4px) saturate(110%)", // Frosted filter effect
        background: "rgba(255, 255, 255, 0.05)"
      }}>
        
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "auto" }}>
          <div style={{ 
            fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", fontSize: "12px", color: "#2d1d3d" 
          }}>
            Moore Love & Care
          </div>
          <button
            onClick={() => setCurrentView(v => v === "home" ? "collection" : "home")}
            style={{
              background: "transparent", border: "1px solid #2d1d3d", padding: "8px 25px",
              borderRadius: "100px", fontSize: "10px", cursor: "pointer", 
              textTransform: "uppercase", letterSpacing: "0.1em", color: "#2d1d3d"
            }}
          >
            {currentView === "home" ? "Collection" : "Home"}
          </button>
        </header>

        {/* STACKED LEFT-ALIGNED HERO */}
        <main style={{ textAlign: "left", maxWidth: "800px" }}>
          <div style={{ 
            fontSize: "11px", letterSpacing: "0.5em", textTransform: "uppercase", 
            marginBottom: "15px", color: "rgba(45, 29, 61, 0.6)" 
          }}>
            THE SOLARIUM SANCTUARY
          </div>
          <h1 style={{
            fontSize: "clamp(60px, 10vw, 120px)", lineHeight: "0.85",
            color: "#2d1d3d", fontWeight: 400, margin: "0 0 40px 0", 
            fontFamily: "'Playfair Display', serif" // Placeholder for Jaguar Font
          }}>
            Moore Love <br /> & Care.
          </h1>
          <button
            style={{
              pointerEvents: "auto", padding: "18px 50px", border: "none",
              background: "#2d1d3d", color: "#f7ece8", borderRadius: "2px",
              letterSpacing: "0.2em", fontSize: "12px", cursor: "pointer", textTransform: "uppercase"
            }}
          >
            Explore Collection
          </button>
        </main>

        {/* MINIMAL FOOTER */}
        <footer style={{ 
          display: "flex", justifyContent: "space-between", fontSize: "10px", 
          letterSpacing: "0.2em", opacity: 0.5, borderTop: "1px solid rgba(45, 29, 61, 0.1)", 
          paddingTop: "25px", color: "#2d1d3d", textTransform: "uppercase" 
        }}>
          <div>© 2026 Moore Estates</div>
          <div>Mental Restoration // Rehabilitation</div>
        </footer>
      </div>

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [-14, 3.2, 24], fov: 35 }} 
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}