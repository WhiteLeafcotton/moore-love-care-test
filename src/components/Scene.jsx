import { useRef, useMemo, extend, useLoader } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// --- UTILS ---
const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 
const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

// --- THE FIXED SOLARIUM UNIT ---
// We use a single group so Three.js treats them as one physical object
const SolariumUnit = () => {
  return (
    <Float 
      speed={2} 
      rotationIntensity={0.5} 
      floatIntensity={0.5}
      position={[14, -1.1, 12]} // THE ANCHOR POINT
    >
      <group>
        {/* 1. THE PLATFORM (at 0,0,0 relative to the Float) */}
        <mesh receiveShadow castShadow renderOrder={1}>
          <cylinderGeometry args={[3, 3, 0.2, 64]} /> 
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.8} 
            depthWrite={true} 
          />
        </mesh>

        {/* 2. THE CHAIR (Positioned relative to the platform) */}
        <group position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, 0]} scale={0.8}>
          <mesh castShadow>
            <boxGeometry args={[1, 0.5, 0.9]} />
            <meshStandardMaterial {...butterProps} />
          </mesh>
          <mesh position={[0, 0.5, -0.4]} rotation={[-0.1, 0, 0]} castShadow>
            <boxGeometry args={[1, 1, 0.2]} />
            <meshStandardMaterial {...butterProps} />
          </mesh>
        </group>

        {/* 3. THE LAMP (Positioned relative to the platform) */}
        <group position={[1.2, 0.1, -0.5]} scale={0.7}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1, 16]} />
            <meshStandardMaterial color="#222" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <coneGeometry args={[0.25, 0.4, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
          </mesh>
        </group>
      </group>
    </Float>
  );
};

// --- SIMPLIFIED SCENE FOR TESTING ---
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28)) : new THREE.Vector3(-24.5, 3.5, -450);
    const targetLook = isHome ? new THREE.Vector3(14, -1, 12) : new THREE.Vector3(-24.5, 1.5, -1000); // Pointing at the Solarium
    
    camera.position.lerp(targetPos, 0.05); 
    camera.lookAt(targetLook);
    
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.1;
    }
  });

  return (
    <>
      <Sky sunPosition={[-20, 8, -100]} />
      <Environment preset="sunset" />
      <directionalLight position={[-15, 30, 10]} intensity={1.5} castShadow />

      {/* Main Architecture Foundation */}
      <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow>
        <boxGeometry args={[20, 8.0, 30]} />
        <meshStandardMaterial {...butterProps} />
      </mesh>

      {/* The Floating Water */}
      <water 
        ref={waterRef} 
        args={[new THREE.PlaneGeometry(2000, 2000), { 
            waterNormals, 
            sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), 
            waterColor: TITLE_PURPLE, 
            distortionScale: 2.0 
        }]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.45, 0]} 
      />

      {/* THE UNIT */}
      <SolariumUnit />
    </>
  );
}