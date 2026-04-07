import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, Sky, ContactShadows } from "@react-three/drei";
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

// 🏛️ Refined Roman Arches (3 Arches, 4 Poles)
function RomanArches({ texture }) {
  const poleCount = 4;
  const spacing = 15;
  
  return (
    <group>
      {/* 4 Pillars/Poles */}
      {[...Array(poleCount)].map((_, i) => (
        <mesh key={`pole-${i}`} position={[(i * spacing) - (spacing * 1.5), 15, 0]} castShadow>
          <cylinderGeometry args={[1.2, 1.5, 30, 32]} />
          <meshStandardMaterial map={texture} color="#ede2df" />
        </mesh>
      ))}

      {/* 3 Roman Arches Connecting Them */}
      {[...Array(poleCount - 1)].map((_, i) => (
        <group key={`arch-${i}`} position={[(i * spacing) - spacing, 30, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            {/* Semicircle Arch */}
            <torusGeometry args={[7.5, 1.2, 16, 100, Math.PI]} />
            <meshStandardMaterial map={texture} color="#ede2df" />
          </mesh>
          {/* Top Header Block */}
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[spacing, 8, 2.4]} />
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

  // Load Textures
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);

  useMemo(() => {
    [pinkStoneTex, travertineTex, grassTex, waterNormals].forEach(t => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
      }
    });
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
    if (travertineTex) travertineTex.repeat.set(2, 2);
    if (grassTex) grassTex.repeat.set(20, 20);
  }, [pinkStoneTex, travertineTex, grassTex, waterNormals]);

  const views = {
    home: { pos: [22, 4, 22], look: [0, 4, 0] },
    collection: { pos: [-65, 15, 55], look: [-95, 8, -25] } 
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

      {/* --- STRUCTURE A: THE CORNER (HOME VIEW) --- */}
      <group position={[0, -0.2, -5]} scale={0.6}>
        {/* Travertine Back Wall */}
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        
        {/* Pink Stone Side Wall */}
        <mesh position={[-21, 15, -1]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[18, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>

        {/* FIXED BASE PLATFORM (PINK STONE) */}
        {/* Now grounded at the base of the corner, not floating */}
        <group position={[-10, 0.5, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[22, 1.2, 15]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
          {/* Subtle secondary tier for "Luxury" feel */}
          <mesh position={[2, 0.6, 2]} castShadow>
            <boxGeometry args={[12, 0.8, 8]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
        </group>
      </group>

      {/* --- STRUCTURE B: THE ROMAN SANCTUARY (COLLECTION VIEW) --- */}
      <group position={[-100, -0.2, -25]} scale={0.8}>
        <RomanArches texture={pinkStoneTex} />
        {/* Floor for the Arches */}
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[60, 1, 15]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* --- GRASSY HILLS --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -80]} receiveShadow>
        <planeGeometry args={[500, 250]} />
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
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.4} scale={200} blur={2.5} far={40} color="#5e4d4d" />
    </>
  );
}