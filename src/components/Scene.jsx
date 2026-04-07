import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
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

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // 1. Load Textures
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
    if (travertineTex) travertineTex.repeat.set(2, 2);
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  // 2. Camera Views (Smooth Transitions)
  const views = {
    home: { pos: [22, 6, 25], look: [0, 4, 0] },
    collection: { pos: [-65, 15, 45], look: [-95, 8, -25] } 
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
      <fog attach="fog" args={["#f7ece8", 20, 150]} />
      
      <PinkClouds />

      {/* --- STRUCTURE A: THE CORNER & GROUNDED PLATFORM --- */}
      <group position={[0, -0.1, -5]} scale={0.6}>
        {/* Travertine Wall */}
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        
        {/* Pink Stone Side Wall */}
        <mesh position={[-21, 15, -1]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[18, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>

        {/* LOCKED LUXURY PLATFORM (NO FLOATING) */}
        <group position={[-10, 0.3, 2]}>
          {/* Main Base */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[22, 0.8, 18]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
          {/* Second Tier */}
          <mesh position={[0, 0.8, -2]} castShadow>
            <boxGeometry args={[18, 0.8, 12]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>
      </group>

      {/* --- STRUCTURE B: THE GRAND ARCHITECTURAL STAIRS --- */}
      <group position={[-85, -0.2, -15]} scale={0.8}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, i * 1.2, i * 4]} castShadow receiveShadow>
            <boxGeometry args={[30, 1.2, 10]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        ))}
        {/* Top Landing Platform */}
        <mesh position={[0, 6, 24]} castShadow receiveShadow>
          <boxGeometry args={[35, 1.2, 20]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* --- WATER SURFACE --- */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 1.5, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.4} scale={200} blur={2.5} far={40} color="#5e4d4d" />
    </>
  );
}