import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./index.css";

export default function App() {
  const [currentView, setCurrentView] = useState("home"); 

  return (
    /* The background color now matches your pinkish-purple sunset fog */
    <div style={{ width: "100vw", height: "100vh", background: "#e8d2ca" }}>
      
      {/* 🏙️ BRAND UI OVERLAY */}
      <div className="ui-overlay" style={{ zIndex: 10, pointerEvents: 'none' }}>
        <h1 className="brand-title" style={{ color: '#4a4a4a' }}>Moore Love and Care</h1>
        <p className="brand-subtitle" style={{ color: '#4a4a4a' }}>THE SOLARIUM SANCTUARY</p>
        
        <button 
          className="explore-button" 
          onClick={() => setCurrentView(currentView === "home" ? "collection" : "home")}
          style={{
            pointerEvents: 'auto',
            position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
            padding: '12px 45px', 
            background: 'rgba(255, 255, 255, 0.2)', 
            border: '1px solid rgba(255, 255, 255, 0.5)',
            color: '#4a4a4a', 
            cursor: 'pointer', 
            backdropFilter: 'blur(15px)', 
            letterSpacing: '4px',
            textTransform: 'uppercase', 
            fontSize: '10px', 
            transition: 'all 0.5s ease',
            borderRadius: '50px'
          }}
        >
          {currentView === "home" ? "Explore Collection" : "Return Home"}
        </button>
      </div>

      {/* 🎨 3D CANVAS */}
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [18, 2, 18], fov: 25 }}
      >
        {/* Suspense is required to prevent errors while textures load */}
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}