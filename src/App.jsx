import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css"; 

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const isHome = currentView === "home";

  return (
    <div className="app-viewport">
      <div className={`ui-overlay ${!isHome ? 'fade-out' : ''}`}>
        
        <header className="main-header">
          <div className="logo">Moore Love & Care</div>
          <button className="tour-button">Schedule Tour</button>
        </header>

        <div className="hero-container">
          <div className="brand-subtitle">The Solarium Sanctuary</div>
          <h1 className="brand-title">
            Moore Love <br /> & Care.
          </h1>
          <button 
            className="explore-button" 
            onClick={() => setCurrentView("collection")}
          >
            Explore Sanctuary
          </button>
        </div>

        <footer className="main-footer">
          <div className="social-links-premium">
            <span className="icon-wrap">INSTAGRAM</span>
            <span className="icon-wrap">FACEBOOK</span>
            <span className="icon-wrap">LINKEDIN</span>
          </div>
          <div className="legal-mark">EST. 2026 // MOORE ESTATES</div>
        </footer>
      </div>

      <div className={`underwater-page ${!isHome ? 'active' : ''}`}>
        <div className="depth-layer">
          <h1>Submerged Grace</h1>
          <p>Mental Restoration // Rehabilitation</p>
        </div>
        <button className="back-button" onClick={() => setCurrentView("home")}>
          ← Return to Surface
        </button>
      </div>

      <Canvas shadows dpr={[1, 2]} camera={{ position: [-14, 3.2, 24], fov: 35 }}>
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}