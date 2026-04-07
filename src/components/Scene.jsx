import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, Sky, ContactShadows, Text, Circle } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

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

// 🏛️ Component for the Arched Bays (Structure B)
function ArchedBays({ texture }) {
  const bayCount = 4;
  const bayWidth = 15;
  
  return (
    <group>
      {[...Array(bayCount)].map((_, i) => (
        <group key={i} position={[(i * bayWidth) - (bayWidth * 1.5), 0, 0]}>
          {/* Main Arched Pole (Column) */}
          <mesh position={[0, 15, 0]} castShadow>
            <cylinderGeometry args={[1.5, 2, 30, 64]} />
            <meshStandardMaterial map={texture} color="#ede2df" />
          </mesh>
          
          {/* Top Arch Structure */}
          <mesh position={[0, 30, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[7.5, 0.75, 16, 100]} />
            <meshStandardMaterial map={texture} color="#ede2df" />
          </mesh>
          <mesh position={[0, 34, 0]}>
            <boxGeometry args={[15, 8, 4]} />
            <meshStandardMaterial map={texture} color="#ede2df" />
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

  // 1. Load All Assets (Including the two distinct textures)
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);

  useMemo(() => {
    if (pinkStoneTex && travertineTex && grassTex) {
      // Repeat Pink Stone (Long columns)
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(1, 4);
      
      // Repeat Travertine (Flat walls)
      travertineTex.wrapS = travertineTex.wrapT = THREE.RepeatWrapping;
      travertineTex.repeat.set(2, 2);

      // Repeat Grass (Hills)
      grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
      grassTex.repeat.set(20, 20);
    }
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, travertineTex, grassTex, waterNormals]);

  // 2. Original Camera Glide (Preserved)
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
      {/* Atmosphere (Sky/Dawn preset) */}
      <Sky distance={450000} sunPosition={[10, 0.5, 20]} turbidity={0.1} rayleigh={2} mieCoefficient={0.005}mieDirectionalG={0.8} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 15, 120]} />
      
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.4} />

      <PinkClouds />

      {/* --- STRUCTURE A: THE MULTI-TEXTURE CORNER (HOME VIEW) --- */}
      <group position={[0, -1.8, -5]} scale={0.6}>
        {/* L-Shape: Defines the visual inside corner */}
        
        {/* Wall 1: Back Wall (TRAVERTINE) */}
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.8} />
        </mesh>
        
        {/* Wall 2: Side Wall (PINK STONE - The 90° Turn) */}
        {/* Moved slightly to create a true shadow gap/depth */}
        <mesh position={[-21, 15, -1]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.9} />
        </mesh>

        {/* --- LUXURY PLATFORM DAIS (PINK STONE) --- */}
        {/* Floating steps leading to a raised dais */}
        {[0.5, 2.5, 4.5].map((y, i) => (
          <Float key={i} speed={2 + i} floatIntensity={1}>
            <mesh position={[-5, y, 6]} castShadow>
              <boxGeometry args={[14, 1.2, 8]} />
              <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" roughness={0.7} />
            </mesh>
          </Float>
        ))}
        {/* Large Main Platform on the water */}
        <mesh position={[-10, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[22, 1, 15]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* --- STRUCTURE B: THE ARCHED SANCTUARY (COLLECTION VIEW) --- */}
      {/* Inspired by the reference image's arched poles */}
      <group position={[-90, -2, -20]} scale={0.7}>
        <ArchedBays texture={pinkStoneTex} />
      </group>

      {/* --- GRASSY HILLS (BACKGROUND LANDSCAPE) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -70]} receiveShadow>
        <planeGeometry args={[400, 200, 64, 64]} />
        <meshStandardMaterial map={grassTex} color="#d4b2b2" roughness={1} metalness={0} />
      </mesh>

      {/* --- WATER SURFACE (ORIGINAL) --- */}
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