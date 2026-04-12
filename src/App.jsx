{/* UI OVERLAY */}
<div style={{
  position: "absolute", inset: 0, zIndex: 10, 
  display: "flex", flexDirection: "column", justifyContent: "space-between",
  padding: "40px 60px",
  pointerEvents: "none",
  transition: "all 0.8s ease-in-out",
  opacity: isHome ? 1 : 0,

  /* THE FADE EFFECT: Frosted on the left, clear on the right */
  background: isHome 
    ? "linear-gradient(to right, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 100%)" 
    : "transparent",
  backdropFilter: isHome ? "blur(8px)" : "blur(0px)",
  WebkitBackdropFilter: isHome ? "blur(8px)" : "blur(0px)", // Safari support
  
  /* Mask ensures the blur itself fades out to the right */
  maskImage: "linear-gradient(to right, black 30%, transparent 70%)",
  WebkitMaskImage: "linear-gradient(to right, black 30%, transparent 70%)"
}}>
  
  {/* HEADER */}
  <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div style={{ 
      fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", 
      fontSize: "12px", color: "#2d1d3d" 
    }}>
      Moore Love & Care
    </div>
    <button
      style={{
        pointerEvents: "auto", background: "transparent", border: "1px solid #2d1d3d", 
        padding: "8px 25px", borderRadius: "100px", fontSize: "10px", 
        cursor: "pointer", textTransform: "uppercase", color: "#2d1d3d"
      }}
    >
      Inquiry
    </button>
  </header>

  {/* STACKED LEFT-ALIGNED HERO */}
  <main style={{ textAlign: "left", maxWidth: "600px" }}>
    <div style={{ 
      fontSize: "11px", letterSpacing: "0.5em", textTransform: "uppercase", 
      marginBottom: "15px", color: "rgba(45, 29, 61, 0.7)" 
    }}>
      THE SOLARIUM SANCTUARY
    </div>
    <h1 style={{
      fontSize: "clamp(60px, 10vw, 110px)", lineHeight: "0.85",
      color: "#2d1d3d", fontWeight: 400, margin: "0 0 40px 0", 
      fontFamily: "'Playfair Display', serif" 
    }}>
      Moore Love <br /> & Care.
    </h1>
    <button
      onClick={() => setCurrentView("collection")}
      style={{
        pointerEvents: "auto", padding: "18px 50px", border: "none",
        background: "#2d1d3d", color: "#f7ece8", borderRadius: "2px",
        letterSpacing: "0.2em", fontSize: "12px", cursor: "pointer", 
        textTransform: "uppercase"
      }}
    >
      Explore Collection
    </button>
  </main>

  {/* FOOTER */}
  <footer style={{ 
    display: "flex", justifyContent: "space-between", fontSize: "10px", 
    letterSpacing: "0.2em", opacity: 0.6, color: "#2d1d3d" 
  }}>
    <div>© 2026 Moore Estates</div>
    <div>Mental Restoration // Rehabilitation</div>
  </footer>
</div>