import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const isHome = currentView === "home";

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7ece8", position: "relative", overflow: "hidden" }}>
      
      {/* UI OVERLAY */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10, 
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "40px 60px",
        pointerEvents: "none",
        // Transition for smooth disappear/reappear
        transition: "all 0.8s ease-in-out",
        opacity: isHome ? 1 : 0,
        // Lightened Frost: Lower blur and very low background alpha
        backdropFilter: isHome ? "blur(3px) saturate(105%)" : "blur(0px)", 
        background: isHome ? "rgba(255, 255, 255, 0.05)" : "transparent"
      }}>
        
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", fontSize: "12px", color: "#2d1d3d" }}>
            Moore Love & Care
          </div>
          <button
            onClick={() => setCurrentView("collection")} // Example trigger
            style={{
              pointerEvents: "auto", background: "transparent", border: "1px solid #2d1d3d", padding: "8px 25px",
              borderRadius: "100px", fontSize: "10px", cursor: "pointer", textTransform: "uppercase", color: "#2d1d3d"
            }}
          >
            Inquiry
          </button>
        </header>

        {/* STACKED LEFT-ALIGNED HERO */}
        <main style={{ textAlign: "left", maxWidth: "800px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: "15px", color: "rgba(45, 29, 61, 0.6)" }}>
            THE SOLARIUM SANCTUARY
          </div>
          <h1 style={{
            fontSize: "clamp(60px, 10vw, 110px)", lineHeight: "0.85",
            color: "#2d1d3d", fontWeight: 400, margin: "0 0 40px 0", 
            fontFamily: "'Playfair Display', serif" 
          }}>
            Moore Love <br /> & Care.
          </h1>
          <button
            onClick={() => setCurrentView("collection")}
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
        <footer style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", letterSpacing: "0.2em", opacity: 0.5, color: "#2d1d3d" }}>
          <div>© 2026 Moore Estates</div>
          <div>Mental Restoration // Rehabilitation</div>
        </footer>
      </div>

      {/* Return Button for when you are at the 2nd location */}
      {!isHome && (
        <button 
          onClick={() => setCurrentView("home")}
          style={{
            position: "absolute", bottom: "40px", left: "40px", zIndex: 20,
            background: "#2d1d3d", color: "white", border: "none", padding: "10px 20px",
            borderRadius: "50px", cursor: "pointer", textTransform: "uppercase", fontSize: "10px"
          }}
        >
          ← Return Home
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