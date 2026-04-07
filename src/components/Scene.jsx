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

  // 1. Load Textures
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
    pinkStoneTex.repeat.set(2, 2);
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(20, 20); // Tighter repeat for visible grass blades
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, grassTex, waterNormals]);

  // 2. UPDATED CAMERA LOGIC (Further distance for collection)
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    // Moved 'pos' further back on the X and Z for a more dramatic transition
    collection: { pos: [-45, 10, 35], look: [-80, 5, -15] } 
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

      {/* --- 90 DEGREE INSIDE CORNER (SCALED DOWN) --- */}
      <group position={[0, -1.8, -5]} scale={0.6}>
        {/* Wall 1 */}
        <mesh position={[-10, 15, -10]} castShadow>
          <boxGeometry args={[20, 30, 1.5]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
        </mesh>
        {/* Wall 2 (The 90° turn) */}
        <mesh position={[-20, 15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[20, 30, 1.5]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
        </mesh>
        
        {/* Base Platform sitting on water */}
        <mesh position={[-10, 0.5, 0]} castShadow>
          <boxGeometry args={[22, 1, 15]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
        </mesh>
      </group>

      {/* --- STAIRS (COLLECTION VIEW) --- */}
      <group position={[-70, -2, -20]} scale={0.8}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[0, i * 1, i * 2.5]} castShadow>
            <boxGeometry args={[12, 0.8, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
          </mesh>
        ))}
      </group>

      {/* --- RE-FIXED GRASSY HILLS --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -60]}>
        <planeGeometry args={[400, 200, 64, 64]} />
        <meshStandardMaterial 
          map={grassTex} 
          color="#d4b2b2" // Keeping it pink-tinted but grassy
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
      
      <ContactShadows opacity={0.25} scale={200} blur={3} far={40} />
    </>
  );
}