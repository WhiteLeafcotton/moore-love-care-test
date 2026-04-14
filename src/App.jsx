import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const isHome = currentView === "home";

  return (
    <div className="app-viewport">
      
      {/* ===== UI LAYER ===== */}
      <div className={`ui-overlay ${!isHome ? "fade-out" : ""}`}>

        {/* ===== HEADER ===== */}
        <header className="main-header">
          <div className="logo">MOORE LOVE & CARE</div>
          <button className="inquiry-button">INQUIRY</button>
        </header>

        {/* ===== HERO ( Strict Left Alignment) ===== */}
        <div className="hero-container">
          <div className="brand-subtitle">
            THE SOLARIUM SANCTUARY
          </div>

          <h1 className="brand-title">
            Moore <br />
            Love <br />
            & Care.
          </h1>

          <button
            className="explore-button"
            onClick={() => setCurrentView("collection")}
          >
            EXPLORE COLLECTION
          </button>
        </div>

        {/* ===== FOOTER (BALANCED GRID) ===== */}
        <footer className="main-footer">
          {/* Column 1: Socials */}
          <div className="social-links">
            <span>FB</span>
            <span>IG</span>
            <span>LI</span>
            <span>YT</span>
          </div>

          {/* Column 2: Tagline */}
          <div className="footer-tag">
            MENTAL RESTORATION // REHABILITATION
          </div>

          {/* Column 3: Legal/Address */}
          <div className="footer-right">
            MOORE ESTATES INTERNATIONAL <br />
            1A AMHERST PLACE — EST. 2026<br />
            PRIVACY POLICY // TERMS
          </div>
        </footer>
      </div>

      {/* ===== UNDERWATER / SECONDARY VIEW ===== */}
      <div className={`underwater-page ${!isHome ? "active" : ""}`}>
        <div className="depth-layer">
          <h1>Submerged Grace</h1>
          <button
            className="back-button"
            onClick={() => setCurrentView("home")}
          >
            ← Return to Surface
          </button>
        </div>
      </div>

      {/* ===== 3D CANVAS ===== */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [-14, 3.2, 24], fov: 35 }}
      >
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}