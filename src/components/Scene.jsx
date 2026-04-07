import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

function PinkClouds() {
  const cloudsRef = useRef();
  useFrame((state) => {
    cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
  });

  return (
    <group ref={cloudsRef}>
      <mesh position={[-25, 30, -70]}>
        <sphereGeometry args={[22, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.15} fog={false} />
      </mesh>
      <mesh position={[35, 40, -90]}>
        <sphereGeometry args={[28, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.15} fog={false} />
      </mesh>
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // 1. Load Textures (Ensure stone_pillar.jpg is renamed correctly in your folder)
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
    pinkStoneTex.repeat.set(2, 2);
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(20, 20); 
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, grassTex, waterNormals]);

  // 2. CAMERA LOGIC: Dramatically further distance for Collection view
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
      <Sky sunPosition={[10, 0.5, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 15, 120]} />
      
      <PinkClouds />

      {/* --- REFINED 90 DEGREE INSIDE CORNER --- */}
      <group position={[0, -1.8, -5]} scale={0.6}>
        {/* Wall 1: Back Wall */}
        <mesh position={[-10, 15, -10.1]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 1.5]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" roughness={0.8} />
        </mesh>

        {/* Wall 2: Side Wall (Slightly darker color to create depth/shadow at the 90° angle) */}
        <mesh position={[-20.1, 15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 1.5]} />
          <meshStandardMaterial map={pinkStoneTex} color="#e8cfc8" roughness={0.8} />
        </mesh>
        
        {/* Base Platform: Sitting right on the water's surface */}
        <mesh position={[-10, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[21, 1, 20]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
        </mesh>

        {/* Corner Shadow Strip: Physically defines the meeting point */}
        <mesh position={[-20, 15, -10]} scale={[0.1, 1, 0.1]}>
          <boxGeometry args={[1, 30, 1]} />
          <meshStandardMaterial color="#000" transparent opacity={0.1} />
        </mesh>
      </group>

      {/* --- STAIRS (COLLECTION VIEW) --- */}
      <group position={[-80, -2, -25]} scale={0.8}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[0, i * 1, i * 2.5]} castShadow>
            <boxGeometry args={[12, 0.8, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
          </mesh>
        ))}
      </group>

      {/* --- GRASSY HILLS (Layered further back) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, -80]} receiveShadow>
        <planeGeometry args={[500, 250, 64, 64]} />
        <meshStandardMaterial 
          map={grassTex} 
          color="#d4b2b2" 
          roughness={1} 
          metalness={0}
        />
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
      
      <ContactShadows opacity={0.35} scale={200} blur={3.5} far={40} color="#5e4d4d" />
    </>
  );
}