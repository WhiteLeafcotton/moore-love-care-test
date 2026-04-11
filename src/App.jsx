import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#ffc0e6" }}>
      <Canvas shadows camera={{ position: [-15, 8, 40], fov: 45 }}>
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>

      <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
        <button 
          onClick={() => setCurrentView(currentView === "home" ? "explore" : "home")}
          style={{ padding: "12px 24px", borderRadius: "30px", border: "none", cursor: "pointer", fontWeight: "bold", background: "white" }}
        >
          {currentView === "home" ? "EXPLORE COLLECTION" : "RETURN HOME"}
        </button>
      </div>
    </div>
  );
}