import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const isHome = currentView === "home";

  // Consistent Button Style
  const buttonBaseStyle = {
    pointerEvents: "auto",
    padding: "14px 40px",
    border: "1px solid #2d1d3d",
    background: "#2d1d3d",
    color: "#f7ece8",
    borderRadius: "100px",
    fontSize: "10px",
    letterSpacing: "0.2em",
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "all 0.3s ease"
  };

  // Raw SVG Icon Definitions (placeholder for library install)
  const FacebookIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
  );
  const InstagramIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
  );
  const LinkedinIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
  );
  const YoutubeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.94C18.88 4 12 4 12 4s-6.88 0-8.6.48a2.78 2.78 0 0 0-1.94 1.94C1 8.14 1 12 1 12s0 3.86.48 5.58a2.78 2.78 0 0 0 1.94 1.94C5.12 20 12 20 12 20s6.88 0 8.6-.48a2.78 2.78 0 0 0 1.94-1.94C23 15.86 23 12 23 12s0-3.86-.48-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7ece8", position: "relative", overflow: "hidden" }}>
      
      {/* UI OVERLAY */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10, 
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "50px 80px",
        pointerEvents: "none",
        transition: "opacity 0.8s ease-in-out, backdrop-filter 0.8s ease-in-out",
        opacity: isHome ? 1 : 0,

        /* --- Updated FADE EFFECT: GLOBAL Baseline Blur and Directional Background Gradient --- */
        /* Update: Baseline blur reduced for global lightness */
        backdropFilter: isHome ? "blur(5px) saturate(105%)" : "blur(0px)",
        WebkitBackdropFilter: isHome ? "blur(5px) saturate(105%)" : "blur(0px)",
        
        /* Updated Background Gradient (lightttttttttled significantly) */
        background: isHome 
          ? "linear-gradient(to right, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(255, 255, 255, 0.01) 100%)" 
          : "transparent",
        
        /* Mask ensured the blur itself fades to right, kept for effect consistency */
        WebkitMaskImage: "linear-gradient(to right, black 30%, rgba(0, 0, 0, 0.4) 100%)",
        maskImage: "linear-gradient(to right, black 30%, rgba(0, 0, 0, 0.4) 100%)"
      }}>
        
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ 
            fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", 
            fontSize: "11px", color: "#2d1d3d" 
          }}>
            Moore Love & Care
          </div>
          <button style={{ ...buttonBaseStyle, background: "transparent", color: "#2d1d3d", padding: "10px 30px" }}>
            Inquiry
          </button>
        </header>

        {/* HERO SECTION */}
        <main style={{ textAlign: "left", maxWidth: "900px" }}>
          <div style={{ 
            fontSize: "11px", letterSpacing: "0.6em", textTransform: "uppercase", 
            marginBottom: "20px", color: "rgba(45, 29, 61, 0.7)" 
          }}>
            THE SOLARIUM SANCTUARY
          </div>
          <h1 style={{
            fontSize: "clamp(80px, 14vw, 160px)", 
            lineHeight: "0.8",
            color: "#2d1d3d", 
            fontWeight: 400, 
            margin: "0 0 50px 0", 
            fontFamily: "'Playfair Display', serif",
            letterSpacing: "-0.02em"
          }}>
            Moore Love <br /> & Care.
          </h1>
          <button
            onClick={() => setCurrentView("collection")}
            style={buttonBaseStyle}
          >
            Explore Collection
          </button>
        </main>

        {/* --- FOOTER UPDATED: Icons replace Text --- */}
        <footer style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr 1fr", 
          fontSize: "9px", 
          letterSpacing: "0.2em", 
          color: "#2d1d3d",
          textTransform: "uppercase",
          borderTop: "1px solid rgba(45, 29, 61, 0.1)",
          paddingTop: "30px",
          alignItems: "center"
        }}>
          {/* Social Icons instead of Text */}
          <div style={{ display: "flex", gap: "20px", pointerEvents: "auto", color: "rgba(45, 29, 61, 0.6)" }}>
            <a href="#" style={{ textDecoration: "none", color: "inherit" }}><FacebookIcon /></a>
            <a href="#" style={{ textDecoration: "none", color: "inherit" }}><InstagramIcon /></a>
            <a href="#" style={{ textDecoration: "none", color: "inherit" }}><LinkedinIcon /></a>
            <a href="#" style={{ textDecoration: "none", color: "inherit" }}><YoutubeIcon /></a>
          </div>
          
          <div style={{ textAlign: "center", opacity: 0.4 }}>
            Mental Restoration // Rehabilitation // Est. 2026
          </div>

          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ opacity: 0.6 }}>Moore Estates International</div>
            <div style={{ opacity: 0.3 }}>Privacy Policy // Terms of Service</div>
          </div>
        </footer>
      </div>

      {/* RETURN BUTTON - CONSISTENT STYLE */}
      {!isHome && (
        <button 
          onClick={() => setCurrentView("home")}
          style={{
            ...buttonBaseStyle,
            position: "absolute", bottom: "50px", left: "80px", zIindex: 20,
            padding: "12px 30px"
          }}
        >
          ← Return to Sanctuary
        </button>
      )}

      <Canvas shadows dpr={[1, 2]} camera={{ position: [-14, 3.2, 24], fov: 35 }}>
        <Suspense fallback={null}>
          <Scene currentView={currentView} />
        </Suspense>
      </Canvas>
    </div>
  );
}