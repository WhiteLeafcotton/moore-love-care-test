import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import "./App.css";

const Icons = {
  Instagram: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>,
  Facebook: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>,
  Linkedin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>,
  Youtube: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.12 1 12 1 12s0 3.88.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.88 23 12 23 12s0-3.88-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
};

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const isHome = currentView === "home";

  return (
    <div className="app-viewport">
      <div 
        className={`ui-overlay ${!isHome ? "fade-out" : ""}`}
        style={{
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          background: "transparent"
        }}
      >
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
          <button className="explore-button" onClick={() => setCurrentView("collection")}>
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
          
          <div className="footer-tag">RESTORATION // REHABILITATION</div>
          
          <div className="footer-right">
            MOORE ESTATES INTERNATIONAL <br />
            PRIVACY // TERMS
          </div>
        </footer>
      </div>

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [-14, 3.2, 24], fov: 35 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh"
        }}
      >
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}