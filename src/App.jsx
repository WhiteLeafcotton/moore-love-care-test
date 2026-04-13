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
        
        {/* HEADER: Nav Link + Business Name + Button */}
        <header className="main-header">
          <div className="logo">MOORE LOVE & CARE</div>
          <nav className="header-nav">
            <span className="nav-link">THE SANCTUARY</span>
          </nav>
          <button className="inquiry-button">INQUIRY</button>
        </header>

        {/* HERO: Big, Left-Aligned, 3-Line Stack */}
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

        {/* FOOTER: Social Icons + Meta + Legal */}
        <footer className="main-footer">
          <div className="footer-left">
            <div className="social-links">
              <span>FB</span>
              <span>IG</span>
              <span>LI</span>
              <span>YT</span>
            </div>
          </div>
          <div className="footer-center">
             MENTAL RESTORATION // REHABILITATION // EST. 2026
          </div>
          <div className="footer-right">
            <div className="legal-mark">
              MOORE ESTATES INTERNATIONAL<br/>
              PRIVACY POLICY // TERMS OF SERVICE
            </div>
          </div>
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