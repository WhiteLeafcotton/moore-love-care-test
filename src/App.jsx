import { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css"; 

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isHome = currentView === "home";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="main-container">
      
      {/* UI OVERLAY */}
      <div className={`ui-overlay ${!isHome ? 'fade-out' : ''}`}>
        
        <header className="site-header">
          <div className="brand-logo">Moore Love & Care</div>
          <button className="inquiry-btn">Inquiry</button>
        </header>

        {/* HERO SECTION - Handled by CSS for Desktop vs Mobile alignment */}
        <main className="hero-content">
          <div className="brand-subtitle">The Solarium Sanctuary</div>
          <h1 className="brand-title">
            Moore Love <br /> & Care.
          </h1>
          <button 
            className="explore-button" 
            onClick={() => setCurrentView("collection")} 
          >
            Explore Collection
          </button>
        </main>

        <footer className="site-footer">
          <div className="social-links">
            <span>FB</span>
            <span>IG</span>
          </div>
          <div className="est-tag">EST. 2026 // MOORE ESTATES</div>
        </footer>
      </div>

      {/* UNDERWATER VIEW */}
      <div className={`underwater-page ${!isHome ? 'active' : ''}`}>
        <div className="depth-layer">
          <h1>Submerged Grace</h1>
          <p>Mental Restoration // Rehabilitation</p>
        </div>
        <button className="return-btn" onClick={() => setCurrentView("home")}>
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