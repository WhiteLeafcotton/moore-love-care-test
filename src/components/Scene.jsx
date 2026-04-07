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

  const views = {
    home: { pos: [22, 8, 28], look: [0, 4, 0] },
    collection: { pos: [-75, 12, 55], look: [-100, 5, -30] } 
  };
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.035); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.035);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Sky sunPosition={[10, 0.5, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 20, 150]} />
      
      <PinkClouds />

      {/* --- HOME AREA: GROUNDED ARCHITECTURAL BLOCKS --- */}
      <group position={[0, 0, -5]} scale={0.6}>
        {/* Main Travertine Wall */}
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        
        {/* Pink Stone Side Wall */}
        <mesh position={[-21, 15, -1]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[18, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>

        {/* STACKED PLATFORM SYSTEM */}
        <group position={[-10, 0, 4]}>
          {/* Base Foundation Slab */}
          <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
            <boxGeometry args={[24, 1, 20]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
          {/* Architectural Upper Block (Real Architecture Feel) */}
          <mesh position={[0, 1.8, -2]} castShadow receiveShadow>
            <boxGeometry args={[18, 1.6, 12]} />
            <meshStandardMaterial map={travertineTex} color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* --- COLLECTION AREA: REVERSED ARCHITECTURAL STAIRS --- */}
      <group position={[-90, 0, -10]} scale={0.8}>
        {/* Top Landing Platform (Now in the back) */}
        <mesh position={[0, 6, -10]} castShadow receiveShadow>
          <boxGeometry args={[35, 1.5, 20]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
        </mesh>

        {/* Steps descending TOWARD the camera */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, (4 - i) * 1.2, i * 4.5]} castShadow receiveShadow>
            <boxGeometry args={[32, 1.2, 8]} />
            <meshStandardMaterial map={travertineTex} color="#ffffff" />
          </mesh>
        ))}
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