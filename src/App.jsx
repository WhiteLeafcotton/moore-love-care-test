import { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isHome = currentView === "home";

  // Handle Resize for Mobile UI triggers
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const buttonBaseStyle = {
    pointerEvents: "auto",
    padding: isMobile ? "12px 32px" : "14px 40px",
    border: "1px solid #2d1d3d",
    background: "#2d1d3d",
    color: "#f7ece8",
    borderRadius: "100px",
    fontSize: isMobile ? "9px" : "10px",
    letterSpacing: "0.2em",
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "all 0.3s ease"
  };

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
    <div style={{ 
      width: "100vw", 
      height: "100vh", 
      background: "#f7ece8", 
      position: "relative", 
      overflow: "hidden",
      // Force content into the status bar area
      padding: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)" 
    }}>
      
      {/* UI OVERLAY */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10, 
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        // Desktop padding vs Mobile padding
        padding: isMobile ? "20px 30px 40px" : "50px 80px",
        pointerEvents: "none",
        transition: "opacity 0.8s ease-in-out, backdrop-filter 0.8s ease-in-out",
        opacity: isHome ? 1 : 0,

        /* --- FROST RECONSTRUCTION --- */
        backdropFilter: isHome ? "blur(8px) saturate(110%)" : "blur(0px)",
        WebkitBackdropFilter: isHome ? "blur(8px) saturate(110%)" : "blur(0px)",
        
        /* Mobile: Top to Bottom Fade | Desktop: Right to Left Fade */
        background: isHome 
          ? (isMobile 
              ? "linear-gradient(to bottom, rgba(255, 250, 248, 0.4) 0%, rgba(255, 250, 248, 0.1) 60%, transparent 100%)"
              : "linear-gradient(to right, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)") 
          : "transparent",
        
        WebkitMaskImage: isMobile
          ? "linear-gradient(to bottom, black 20%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0) 95%)"
          : "linear-gradient(to right, black 30%, rgba(0, 0, 0, 0.4) 100%)",
        maskImage: isMobile
          ? "linear-gradient(to bottom, black 20%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0) 95%)"
          : "linear-gradient(to right, black 30%, rgba(0, 0, 0, 0.4) 100%)"
      }}>
        
        {/* HEADER */}
        <header style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginTop: isMobile ? "env(safe-area-inset-top)" : "0" 
        }}>
          <div style={{ 
            fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", 
            fontSize: isMobile ? "9px" : "11px", color: "#2d1d3d" 
          }}>
            Moore Love & Care
          </div>
          <button style={{ 
            ...buttonBaseStyle, 
            background: "transparent", 
            color: "#2d1d3d", 
            border: "1px solid rgba(45, 29, 61, 0.2)",
            padding: isMobile ? "8px 20px" : "10px 30px",
            fontSize: "8px"
          }}>
            Inquiry
          </button>
        </header>

        {/* HERO SECTION */}
        <main style={{ 
            textAlign: isMobile ? "center" : "left", 
            maxWidth: isMobile ? "100%" : "900px",
            marginTop: isMobile ? "-10vh" : "0" // Pull up slightly on mobile for balance
        }}>
          <div style={{ 
            fontSize: isMobile ? "9px" : "11px", 
            letterSpacing: "0.5em", 
            textTransform: "uppercase", 
            marginBottom: "15px", 
            color: "rgba(45, 29, 61, 0.6)" 
          }}>
            THE SOLARIUM SANCTUARY
          </div>
          <h1 style={{
            fontSize: isMobile ? "64px" : "clamp(80px, 14vw, 160px)", 
            lineHeight: isMobile ? "0.9" : "0.8",
            color: "#2d1d3d", 
            fontWeight: 400, 
            margin: isMobile ? "0 0 40px 0" : "0 0 50px 0", 
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

        {/* FOOTER */}
        <footer style={{ 
          display: isMobile ? "flex" : "grid", 
          flexDirection: isMobile ? "column" : "row",
          gridTemplateColumns: isMobile ? "none" : "1fr 1fr 1fr", 
          gap: isMobile ? "20px" : "0",
          fontSize: "8px", 
          letterSpacing: "0.2em", 
          color: "#2d1d3d",
          textTransform: "uppercase",
          borderTop: "1px solid rgba(45, 29, 61, 0.1)",
          paddingTop: "25px",
          alignItems: "center",
          marginBottom: isMobile ? "env(safe-area-inset-bottom)" : "0"
        }}>
          <div style={{ display: "flex", gap: "25px", pointerEvents: "auto", color: "rgba(45, 29, 61, 0.5)" }}>
            <a href="#" style={{ color: "inherit" }}><FacebookIcon /></a>
            <a href="#" style={{ color: "inherit" }}><InstagramIcon /></a>
            <a href="#" style={{ color: "inherit" }}><LinkedinIcon /></a>
            <a href="#" style={{ color: "inherit" }}><YoutubeIcon /></a>
          </div>
          
          <div style={{ textAlign: "center", opacity: 0.4 }}>
            Mental Restoration // Rehabilitation
          </div>

          <div style={{ textAlign: isMobile ? "center" : "right", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ opacity: 0.6 }}>Moore Estates International</div>
            <div style={{ opacity: 0.2 }}>Est. 2026</div>
          </div>
        </footer>
      </div>

      {!isHome && (
        <button 
          onClick={() => setCurrentView("home")}
          style={{
            ...buttonBaseStyle,
            position: "absolute", 
            bottom: isMobile ? "40px" : "50px", 
            left: isMobile ? "50%" : "80px",
            transform: isMobile ? "translateX(-50%)" : "none",
            zIndex: 20,
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