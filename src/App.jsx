import { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css"; // Double check: Is your file named App.css with a capital A?

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isHome = currentView === "home";

  // Efficient mobile detection to handle alignment shifts
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="solarium-app">
      
      {/* 1. HIGH-END UI LAYER (HOME VIEW) */}
      <div className={`main-ui ${!isHome ? 'fade-out' : ''}`}>
        
        {/* SHARED HEADER */}
        <header className="solarium-header">
          <div className="brand-logotype">Moore Love & Care</div>
          <button className="inquiry-btn">Schedule Tour</button>
        </header>

        {/* HERO SECTION (EDITORIAL LAYOUT) */}
        <main className="solarium-hero">
          <div className="content-lockup">
            <div className="brand-subtitle">The Solarium Sanctuary</div>
            <h1 className="brand-title">
              Moore Love <br /> & Care.
            </h1>
            <button 
              className="explore-cta" 
              onClick={() => setCurrentView("collection")}
            >
              Explore Sanctuary
            </button>
          </div>
        </main>

        {/* SHARED FOOTER */}
        <footer className="solarium-footer">
          <div className="social-links">
            <span>FB</span>
            <span>IG</span>
          </div>
          <div className="editorial-meta">EST. 2026 // SOLIS ESTATES</div>
        </footer>
      </div>

      {/* 2. UNDERWATER VIEW */}
      <div className={`underwater-overlay ${!isHome ? 'active' : ''}`}>
        <div className="depth-layer hero">
          <h1>Submerged Grace</h1>
          <p>Mental Restoration // Rehabilitation</p>
        </div>
        
        <button 
          className="return-btn"
          onClick={() => setCurrentView("home")}
        >
          ← Return to Surface
        </button>
      </div>

      {/* 3. 3D SCENE */}
      <Canvas shadows dpr={[1, 2]} camera={{ position: [-14, 3.2, 24], fov: 35 }}>
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}