import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./index.css";

export default function App() {
  const [isSubmerged, setIsSubmerged] = useState(false);
  const [currentView, setCurrentView] = useState("home"); 

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      
      {/* UI Overlay (Landing Page) */}
      <div className={`ui-overlay ${isSubmerged ? "fade-out" : ""}`}>
        <h1 className="brand-title">Moore Love and Care</h1>
        <p className="brand-subtitle">THE SOLARIUM SANCTUARY</p>
        <button className="explore-button" onClick={() => setIsSubmerged(true)}>
          Explore Care
        </button>
      </div>

      {/* Underwater UI */}
      {isSubmerged && (
        <div className="underwater-ui">
          <h1 className="brand-title">Moore Love and Care</h1>
          <button 
            className="pan-button" 
            onClick={() => setCurrentView(currentView === "home" ? "structure" : "home")}
            style={{
              position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
              padding: '12px 35px', background: 'rgba(255,255,255,0.05)', border: '1px solid white',
              color: 'white', cursor: 'pointer', backdropFilter: 'blur(15px)', letterSpacing: '3px',
              textTransform: 'uppercase', fontSize: '12px'
            }}
          >
            {currentView === "home" ? "View Collection" : "Back to Center"}
          </button>
        </div>
      )}

      <Canvas shadows dpr={[1, 2]}>
        <Scene isSubmerged={isSubmerged} currentView={currentView} />
      </Canvas>
    </div>
  );
}