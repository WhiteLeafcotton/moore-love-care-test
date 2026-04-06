import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./index.css";

export default function App() {
  const [currentView, setCurrentView] = useState("home"); 

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f2e9e4" }}>
      
      <div className="ui-overlay" style={{ zIndex: 10, pointerEvents: 'none' }}>
        <h1 className="brand-title">Moore Love and Care</h1>
        <p className="brand-subtitle">THE SOLARIUM SANCTUARY</p>
        
        <button 
          className="explore-button" 
          onClick={() => setCurrentView(currentView === "home" ? "collection" : "home")}
          style={{
            pointerEvents: 'auto',
            position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
            padding: '12px 45px', background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.5)',
            color: '#2d2d2d', cursor: 'pointer', backdropFilter: 'blur(15px)', letterSpacing: '4px',
            textTransform: 'uppercase', fontSize: '10px', transition: 'all 0.5s ease', borderRadius: '50px'
          }}
        >
          {currentView === "home" ? "Explore Collection" : "Return Home"}
        </button>
      </div>

      <Canvas shadows dpr={[1, 2]} camera={{ position: [18, 2, 18], fov: 25 }}>
        {/* CRITICAL: This Suspense component prevents the "Broken" white screen */}
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}