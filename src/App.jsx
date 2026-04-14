import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css";

const Icons = {
  Instagram: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  Facebook: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  Linkedin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  Youtube: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <polygon points="9.75 15.02 15.5 12 9.75 8.98"/>
    </svg>
  )
};

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
            Moore <br /> Love <br /> & Care.
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
            <span className="social-icon"><Icons.Instagram /></span>
            <span className="social-icon"><Icons.Facebook /></span>
            <span className="social-icon"><Icons.Linkedin /></span>
            <span className="social-icon"><Icons.Youtube /></span>
          </div>

          <div>RESTORATION // REHABILITATION</div>

          <div>
            MOORE ESTATES INTERNATIONAL <br />
            PRIVACY // TERMS
          </div>
        </footer>
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ position: [-14, 3.2, 24], fov: 35 }}
        style={{
          position: "fixed",
          inset: 0
        }}
      >
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}