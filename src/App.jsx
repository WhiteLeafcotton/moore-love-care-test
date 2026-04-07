import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./index.css";

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f5eae8", position: "relative" }}>
      
      {/* UI OVERLAY - Matched to the "Moore Love & Care" Editorial Style */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            letterSpacing: "0.15em",
            color: "#3e3e3e",
            fontWeight: 400,
            margin: 0,
            textTransform: "uppercase",
            fontFamily: "'Cinzel', serif" // Essential for that premium look
          }}
        >
          Moore Love & Care
        </h1>

        <p
          style={{
            letterSpacing: "0.4em",
            fontSize: "10px",
            marginTop: "12px",
            color: "rgba(62, 62, 62, 0.7)",
            fontWeight: 700
          }}
        >
          THE SOLARIUM SANCTUARY
        </p>

        <button
          onClick={() =>
            setCurrentView(
              currentView === "home" ? "collection" : "home"
            )
          }
          style={{
            pointerEvents: "auto",
            marginTop: "60px",
            padding: "16px 50px",
            borderRadius: "50px",
            border: "1px solid rgba(0,0,0,0.05)",
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(10px)",
            letterSpacing: "0.2em",
            fontSize: "11px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.4s ease"
          }}
        >
          {currentView === "home"
            ? "Explore Collection"
            : "Return Home"}
        </button>
      </div>

      {/* 3D CANVAS - Updated Camera for the Monumental Look */}
      <Canvas 
        shadows 
        dpr={[1, 2]}
        camera={{ position: [20, 2.5, 26], fov: 32 }} // This matches the reference angle
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}