import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// ☁️ Component for Minimal, Moving Pink Clouds
function PinkClouds() {
  const cloudsRef = useRef();

  useFrame((state) => {
    // Gentle horizontal drift
    cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 3;
    // Slow backward drift
    cloudsRef.current.position.z += 0.005;
    if (cloudsRef.current.position.z > -20) cloudsRef.current.position.z = -100;
  });

  return (
    <group ref={cloudsRef} position={[0, 0, -80]}>
      {/* Cloud 1 */}
      <mesh position={[-30, 25, 10]} scale={[1.2, 1, 1]}>
        <sphereGeometry args={[18, 32, 32]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.3} fog={false} />
      </mesh>
      {/* Cloud 2 */}
      <mesh position={[25, 30, -10]} scale={[1, 0.8, 1.3]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.3} fog={false} />
      </mesh>
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // Load All Assets
  const stoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`); // Scaled for columns
  const platformTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`); // Reuse old stone
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (stoneTex) {
      stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
      stoneTex.repeat.set(1, 8); // Long stretch on columns
    }
    if (grassTex) {
      grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
      grassTex.repeat.set(12, 12); // Tighter repeat for foreground hills
    }
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [stoneTex, grassTex, waterNormals]);

  // Handle Original Camera Movement & Water Time
  useFrame((state, delta) => {
    // Keep your camera views intact:
    const views = {
      home: { pos: [18, 2, 18], look: [0, 2, 0] },
      collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
    };
    const targetLook = new THREE.Vector3(0, 0, 0);
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      {/* 🌅 Atmosphere & Sky */}
      <Sky sunPosition={[10, 0.5, 20]} rayleigh={1.2} mieCoefficient={0.005}mieDirectionalG={0.8} />
      <Environment preset="sunset" />
      {/* Dreamy Pink Mist Blend */}
      <fog attach="fog" args={["#f7ece8", 30, 110]} />
      
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.4} />

      <PinkClouds />

      {/* --- STRUCTURES (MINIMALIST PILLARS & PLATFORM) --- */}
      {/* Scaled down significantly for an easier 'inside corner' feel */}
      <group position={[0, -2, -5]} scale={0.75}>
        
        {/* The Long Stone Columns */}
        <mesh position={[-6, 12, 0]} castShadow>
          <boxGeometry args={[3.5, 30, 3.5]} />
          <meshStandardMaterial map={stoneTex} color="#ede2df" roughness={0.9} />
        </mesh>
        <mesh position={[6, 12, 0]} castShadow>
          <boxGeometry args={[3.5, 30, 3.5]} />
          <meshStandardMaterial map={stoneTex} color="#ede2df" roughness={0.9} />
        </mesh>
        
        {/* Centered Floating Platform (The "Stairs/Platform") */}
        <Float speed={1.5} floatIntensity={0.8} rotationIntensity={0.05}>
          <mesh position={[0, 6, 6]} castShadow>
            <boxGeometry args={[14, 1.2, 7]} />
            <meshStandardMaterial map={platformTex} color="#f2dcd5" roughness={0.7} />
          </mesh>
        </Float>
      </group>

      {/* --- GRASSY HILLS (BACKGROUND LANDSCAPE) --- */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -60]}>
        <mesh>
          <planeGeometry args={[250, 120, 64, 64]} />
          <meshStandardMaterial map={grassTex} color="#a6b18c" roughness={1} />
        </mesh>
        {/* Second landscape layer for better blending */}
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[300, 150, 16, 16]} />
          <meshStandardMaterial color="#f5eae8" roughness={1} depthTest={false} depthWrite={false} />
        </mesh>
      </group>

      {/* --- REFRESHED WATER SURFACE --- */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20),
          sunColor: 0xffffff,
          // Color set to blend with both hills and sky haze
          waterColor: 0xe5d9d3,
          distortionScale: 2.0,
          fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.2, 0]}
      />
      
      <ContactShadows opacity={0.3} scale={200} blur={3} far={40} />
    </>
  );
}