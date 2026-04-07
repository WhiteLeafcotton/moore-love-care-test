import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, Sky, ContactShadows, Text, Circle } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// ☁️ Subtle Clouds
function PinkClouds() {
  const cloudsRef = useRef();
  useFrame((state) => {
    cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.08) * 2;
  });

  return (
    <group ref={cloudsRef}>
      <mesh position={[-25, 30, -70]}>
        <sphereGeometry args={[22, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.12} fog={false} />
      </mesh>
      <mesh position={[35, 40, -90]}>
        <sphereGeometry args={[28, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.12} fog={false} />
      </mesh>
    </group>
  );
}

// 🏛️ The Updated Volumetric Arches (The Fix!)
function ArchedBays({ texture }) {
  const bayCount = 3; // Switched to 3 matching the user reference
  const bayWidth = 15;
  const depth = 2.5; // This adds the architectural depth from the ref

  return (
    <group>
      {[...Array(bayCount)].map((_, i) => (
        <group key={i} position={[(i * bayWidth) - (bayWidth * 1.0), 0, 0]}>
          
          {/* Main Arched Column (Pillar) - Kept pink-toned */}
          <mesh position={[0, 15, 0]} castShadow>
            <cylinderGeometry args={[1.5, 2, 30, 64]} />
            <meshStandardMaterial map={texture} color="#ede2df" />
          </mesh>
          
          {/* THE FIX: VOLUMETRIC ARCH TOP */}
          {/* 1. The main curved part (Torus provides 3D volume, not a flat plane) */}
          <mesh position={[0, 30, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <torusGeometry args={[7.5, depth / 2, 16, 100]} />
            <meshStandardMaterial map={texture} color="#ede2df" roughness={0.8} />
          </mesh>
          
          {/* 2. The flat, heavy head block above the arch (from the ref) */}
          <mesh position={[0, 34, 0]} castShadow receiveShadow>
            <boxGeometry args={[15, 8, depth + 1]} />
            <meshStandardMaterial map={texture} color="#ede2df" roughness={0.8} />
          </mesh>

          {/* ADDED: Internal Arch Ceiling shadow (enhances 3D depth) */}
          <mesh position={[0, 30, 0]} scale={[1, 1, 0.9]}>
            <torusGeometry args={[7.3, depth / 2, 8, 50]} />
            <meshStandardMaterial color="#333" transparent opacity={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // Textures (verify paths/extensions from file explorer)
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);

  useMemo(() => {
    [pinkStoneTex, travertineTex, grassTex, waterNormals].forEach(t => {
      if (t) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
    // Scaled repeat for columns
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
    // Scaled repeat for walls
    if (travertineTex) travertineTex.repeat.set(2, 2);
    // Repeat Grass (Hills)
    if (grassTex) grassTex.repeat.set(20, 20);
  }, [pinkStoneTex, travertineTex, grassTex, waterNormals]);

  // Original glide logic
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-55, 12, 45], look: [-90, 5, -20] } 
  };
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Sky sunPosition={[10, 0.5, 20]} rayleigh={1.5} turbidity={0.1} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 15, 120]} />
      
      <PinkClouds />

      {/* --- STRUCTURE A: THE MULTI-TEXTURE CORNER & FLOATING DAIS --- */}
      <group position={[0, -1.8, -5]} scale={0.6}>
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.8} />
        </mesh>
        
        <mesh position={[-21, 15, -1]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.9} />
        </mesh>

        {[0.5, 2.5, 4.5].map((y, i) => (
          <Float key={i} speed={2 + i} floatIntensity={1}>
            <mesh position={[-5, y, 6]} castShadow>
              <boxGeometry args={[14, 1.2, 8]} />
              <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" roughness={0.7} />
            </mesh>
          </Float>
        ))}
        <mesh position={[-10, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[22, 1, 15]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* --- STRUCTURE B: THE REFINED ARCHED BAY (COLLECTION VIEW) --- */}
      {/* Pushed further back and uses new volumetric geometry */}
      <group position={[-100, -2, -25]} scale={0.8}>
        <ArchedBays texture={pinkStoneTex} />
      </group>

      {/* --- GRASSY HILLS --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -70]} receiveShadow>
        <planeGeometry args={[400, 200]} />
        <meshStandardMaterial map={grassTex} color="#d4b2b2" roughness={1} />
      </mesh>

      {/* --- WATER --- */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 1.5, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.2, 0]}
      />
      
      <ContactShadows opacity={0.3} scale={200} blur={3} far={40} color="#5e4d4d" />
    </>
  );
}