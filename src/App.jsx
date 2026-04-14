import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Instagram, Facebook, Linkedin, Youtube } from "lucide-react"; 
import Scene from "./components/Scene";
import "./App.css";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const isHome = currentView === "home";

  return (
    <div className="app-viewport">
      
      {/* UI LAYER */}
      <div className={`ui-overlay ${!isHome ? "fade-out" : ""}`}>

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
            <Instagram size={18} strokeWidth={1.2} className="social-icon" />
            <Facebook size={18} strokeWidth={1.2} className="social-icon" />
            <Linkedin size={18} strokeWidth={1.2} className="social-icon" />
            <Youtube size={18} strokeWidth={1.2} className="social-icon" />
          </div>

          <div className="footer-tag">RESTORATION // REHABILITATION</div>

          <div className="footer-right">
            MOORE ESTATES INTERNATIONAL <br />
            EST. 2026 — PRIVACY // TERMS
          </div>
        </footer>
      </div>

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