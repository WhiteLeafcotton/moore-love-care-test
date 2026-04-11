import { useRef, useMemo } from "react";
import { useThree, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const OrganicSanctuaryHills = () => {
  const meshRef = useRef();

  // Load a high-quality "Normal Map" - this provides the "bumps" and "form"
  const [normalMap, roughnessMap] = useLoader(THREE.TextureLoader, [
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big_nm.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg"
  ]);

  useMemo(() => {
    [normalMap, roughnessMap].forEach(t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(12, 12); // Tiling it makes the "detail" look smaller and more realistic
    });
  }, [normalMap, roughnessMap]);

  const geometry = useMemo(() => {
    // 512 segments gives us "clay-like" smoothness
    const g = new THREE.PlaneGeometry(650, 650, 512, 512);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    
    // Applying the hill math to the vertices
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const z = pos[i+2];
      
      // The Base Hill Shape
      const dist = Math.sqrt(x * x + z * z);
      const flatZone = 45; 
      const smoothZone = 25;
      let influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / smoothZone, 1.0);
      
      // Add "Micro-Form" (The craggy, bumpy topping)
      const detail = (Math.sin(x * 0.2) * Math.cos(z * 0.2) * 1.5);
      const hills = (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4);
      
      pos[i + 1] = (hills + detail) * influence;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -4, -40]} receiveShadow>
      <meshStandardMaterial 
        color="#2d4216"        // Deep, "expensive" forest green
        normalMap={normalMap}   // This creates the tiny shadows that look like "form"
        roughnessMap={roughnessMap} 
        roughness={0.8}         // Soft, non-reflective like real moss
        metalness={0.0}
        normalScale={new THREE.Vector2(1.5, 1.5)} // Intensifies the bumps
      />
    </mesh>
  );
};