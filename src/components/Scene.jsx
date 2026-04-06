import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// 🌅 Realistic Procedural Haze Sky (Pinkish-Purple Gradient)
function GradientSky() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#c39bd3"); // Zenith: Soft Purple
    grad.addColorStop(1, "#f5eae8"); // Horizon: Light Baby Pink
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 256);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[500, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// Drifting Haze Plane (For atmospheric realism)
function Haze() {
  const ref = useRef();
  useFrame((state, delta) => (ref.current.rotation.z += delta * 0.02));
  return (
    <mesh ref={ref} position={[0, -20, -100]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial color="#f5eae8" transparent opacity={0.15} fog={false} />
    </mesh>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  // 🎥 COORDINATES (LOCKED)
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 8, 20], look: [-55, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // 🎨 LOCKED TEXTURES (Ensure travertine.jpg is in /public/textures/)
  // Increase wrap count for finer texture resolution (12,12)
  const travertineTexture = useLoader(THREE.TextureLoader, "/textures/travertine.jpg");
  travertineTexture.wrapS = travertineTexture.wrapT = THREE.RepeatWrapping;
  travertineTexture.repeat.set(12, 12); // Higher repeat = tighter texture like ref

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  useFrame((state, delta) => {
    // 🎥 Transition Logic (LOCKED)
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    
    // 🌊 Water animation (LOCKED)
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  // Reusable component for that grainy, tactile stucco texture from reference
  const TexturedMaterial = () => (
    <meshStandardMaterial 
      color="#f5eae8" // Main light baby pink hue
      map={travertineTexture} 
      roughnessMap={travertineTexture}
      roughness={1.2} // High roughness prevents cold "plastic" shine
      metalness={0.05}
    />
  );

  return (
    <>
      <GradientSky />
      <Haze />
      <Environment preset="dawn" />
      {/* Fog blends perfectly with pink horizon color */}
      <fog attach="fog" args={["#f5eae8", 15, 120]} /> 
      
      <spotLight position={[30, 30, 20]} intensity={1.8} castShadow color="#ffebd1" />
      <ambientLight intensity={0.5} />

      {/* --- 🏠 STRUCTURE 1 (HOME) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <TexturedMaterial />
        </mesh>
        <mesh position={[0, 8, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 2.5, 32]} />
          <TexturedMaterial />
        </mesh>
      </group>

      {/* --- 🚪 STRUCTURE 2 (DOORWAY) --- */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        
        {/* Architectural Doorway Frame */}
        <group position={[0, 12, 0]}>
          <mesh position={[-6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <TexturedMaterial />
          </mesh>
          <mesh position={[6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <TexturedMaterial />
          </mesh>
          <mesh position={[0, 13, 0]} castShadow>
            <boxGeometry args={[16, 4, 4]} />
            <TexturedMaterial />
          </mesh>
        </group>

        {/* Floating Steps */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 1.5, 10 - i * 4]} castShadow>
            <boxGeometry args={[8, 0.5, 6]} />
            <TexturedMaterial />
          </mesh>
        ))}

        {/* 🔮 RESTORED SPHERE IN WATER */}
        <Float speed={1.5} floatIntensity={0.5} position={[-8, 1, 14]}>
          <mesh castShadow>
            <sphereGeometry args={[3.5, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" speed={2} distort={0.2} transmission={1} 
              thickness={2} roughness={0.02} iridescence={1.5}
            />
          </mesh>
        </Float>
      </group>

      {/* 🌊 GLOBAL WATER SURFACE: "Flushed" grey-pink color */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 1.5, fog: true, // "Flushed" Water Color
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.3} scale={200} blur={3} far={40} />
    </>
  );
}