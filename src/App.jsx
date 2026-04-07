import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./index.css";

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f5eae8" }}>
      
      {/* UI OVERLAY */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
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
            fontSize: "48px",
            letterSpacing: "6px",
            color: "#4a4a4a",
            fontWeight: 300,
          }}
        >
          Moore Love & Care
        </h1>

        <p
          style={{
            letterSpacing: "4px",
            fontSize: "12px",
            marginTop: "10px",
            color: "#7a7a7a",
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
            marginTop: "40px",
            padding: "12px 40px",
            borderRadius: "50px",
            border: "1px solid rgba(255,255,255,0.6)",
            background: "rgba(255,255,255,0.25)",
            backdropFilter: "blur(12px)",
            letterSpacing: "3px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          {currentView === "home"
            ? "Explore Collection"
            : "Return Home"}
        </button>
      </div>

      {/* 3D CANVAS */}
      <Canvas shadows camera={{ position: [12, 6, 18], fov: 28 }}>
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}