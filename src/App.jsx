import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css";

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  return (
    <div className="app-viewport">

      <div className="ui-overlay">

        <header className="main-header">
          <div className="logo">MOORE LOVE & CARE</div>
          <button className="inquiry-button">INQUIRY</button>
        </header>

        <div className="hero-container">
          <div className="brand-subtitle">THE SOLARIUM SANCTUARY</div>

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

        <footer className="main-footer">
          <div className="social-links">
            <span className="social-icon">IG</span>
            <span className="social-icon">FB</span>
            <span className="social-icon">LI</span>
            <span className="social-icon">YT</span>
          </div>

          <div className="footer-right">
            MOORE ESTATES INTERNATIONAL <br />
            PRIVACY // TERMS
          </div>
        </footer>
      </div>

      {/* 🔥 CRITICAL FIX */}
      <Canvas
        style={{ position: "fixed", inset: 0 }}
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