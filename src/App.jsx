import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7ece8", position: "relative" }}>
      <div style={{
        position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}>
        <h1 style={{
          fontSize: "clamp(2rem, 8vw, 4rem)", letterSpacing: "0.15em",
          color: "#3e3e3e", fontWeight: 400, margin: 0, fontFamily: "'Cinzel', serif"
        }}>
          Moore Love & Care
        </h1>
        <p style={{ letterSpacing: "0.5em", fontSize: "10px", marginTop: "10px", color: "rgba(62, 62, 62, 0.6)" }}>
          THE SOLARIUM SANCTUARY
        </p>
        <button
          onClick={() => setCurrentView(v => v === "home" ? "collection" : "home")}
          style={{
            pointerEvents: "auto", marginTop: "5vh", padding: "15px 50px",
            borderRadius: "50px", border: "1px solid rgba(0,0,0,0.05)",
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)",
            letterSpacing: "0.2em", fontSize: "11px", cursor: "pointer", textTransform: "uppercase"
          }}
        >
          {currentView === "home" ? "Explore Collection" : "Return Home"}
        </button>
      </div>

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        /* Pulled back to Z:60 and raised to Y:15 for the zoom-out view */
        camera={{ position: [40, 15, 60], fov: 35 }} 
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}