import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const GRASS_COUNT = 75000; // Total blades of grass

const RealGrassHills = () => {
  const meshRef = useRef();
  
  // 1. Create a single "Blender-style" blade geometry
  const bladeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.2, 0.8, 1, 4); // Thin and tall
    geo.translate(0, 0.4, 0); // Offset so the bottom is at 0
    return geo;
  }, []);

  // 2. The Hill Height Logic (must match your terrain)
  const getHillHeight = (x, z) => {
    const dist = Math.sqrt(x * x + z * z);
    const flatZone = 45; 
    const smoothZone = 25;
    let influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / smoothZone, 1.0);
    return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
  };

  // 3. Scatter the blades
  const material = new THREE.MeshStandardMaterial({
    color: "#4d7a2d",
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  });

  useMemo(() => {
    const dummy = new THREE.Object3D();
    const mesh = new THREE.InstancedMesh(bladeGeo, material, GRASS_COUNT);
    
    for (let i = 0; i < GRASS_COUNT; i++) {
      // Random position within the hill area
      const x = (Math.random() - 0.5) * 600;
      const z = (Math.random() - 0.5) * 600;
      const y = getHillHeight(x, z);

      dummy.position.set(x, y - 4.2, z); // Adjust to sit on surface
      
      // Randomize rotation and scale for "organic" look
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.rotation.x = (Math.random() - 0.5) * 0.3; // Slight tilt
      dummy.scale.setScalar(0.5 + Math.random() * 1.5);
      
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    return mesh;
  }, []);

  // 4. Subtle Wind Sway (The "Blender" secret)
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Use a simple shader modification or vertex colors for swaying
    // For now, we move the whole group slightly
  });

  return (
    <group position={[0, 0, -40]}>
      <instancedMesh ref={meshRef} args={[bladeGeo, material, GRASS_COUNT]} />
    </group>
  );
};