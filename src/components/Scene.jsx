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
      {/* Just two subtle, long clouds like the reference */}
      <mesh position={[-20, 25, -60]}>
        <sphereGeometry args={[20, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.2} fog={false} />
      </mesh>
      <mesh position={[30, 35, -80]}>
        <sphereGeometry args={[25, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.2} fog={false} />
      </mesh>
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // 1. Load Textures (Only pink stone and grass)
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
    pinkStoneTex.repeat.set(2, 2);
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(10, 10);
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, grassTex, waterNormals]);

  // 2. RESTORED EXACT ORIGINAL CAMERA LOGIC
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
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
      <fog attach="fog" args={["#f7ece8", 10, 100]} />
      
      <PinkClouds />

      {/* --- 90 DEGREE INSIDE CORNER (HOME VIEW) --- */}
      <group position={[0, -2, -5]}>
        {/* Wall A */}
        <mesh position={[-10, 12, -10]} castShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
        </mesh>
        {/* Wall B (90 Degrees) */}
        <mesh position={[-19, 12, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
        </mesh>
        
        {/* The Floating Platform from the Unseen Ref */}
        <Float speed={2} floatIntensity={0.5}>
          <mesh position={[-5, 5, 2]} castShadow>
            <boxGeometry args={[12, 1, 8]} />
            <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
          </mesh>
        </Float>
      </group>

      {/* --- STAIRS STRUCTURE (COLLECTION VIEW) --- */}
      <group position={[-50, -2, -10]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, i * 1.2, i * 2]} castShadow>
            <boxGeometry args={[10, 0.8, 3]} />
            <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
          </mesh>
        ))}
      </group>

      {/* --- GRASSY PINK HILLS --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -50]}>
        <planeGeometry args={[300, 150, 32, 32]} />
        {/* Blending the green grass texture with a pink tint */}
        <meshStandardMaterial map={grassTex} color="#d4b2b2" roughness={1} />
      </mesh>

      {/* --- ORIGINAL WATER --- */}
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
      
      <ContactShadows opacity={0.25} scale={200} blur={3} far={40} />
    </>
  );
}