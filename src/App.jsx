import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./index.css";

export default function App() {
  const [isSubmerged, setIsSubmerged] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      
      {/* UI Overlay (ABOVE WATER — UNCHANGED) */}
      <div className={`ui-overlay ${isSubmerged ? "fade-out" : ""}`}>
        <h1 className="brand-title">Moore Love and Care</h1>
        <p className="brand-subtitle">THE SOLARIUM SANCTUARY</p>
        <button
          className="explore-button"
          onClick={() => setIsSubmerged(true)}
        >
          Explore Care
        </button>
      </div>

      {/* 🌊 UNDERWATER UI (NEW — DOES NOT AFFECT ABOVE VIEW) */}
      {isSubmerged && (
        <div className="underwater-ui">
          <h1 className="brand-title">Moore Love and Care</h1>
          <p className="brand-subtitle">BENEATH THE SURFACE</p>
        </div>
      )}

      {/* 3D Scene */}
      <Canvas
        shadows
        camera={{ position: [18, 2, 18], fov: 25 }}
        dpr={[1, 2]}
      >
        <Scene isSubmerged={isSubmerged} />
      </Canvas>
    </div>
  );
}