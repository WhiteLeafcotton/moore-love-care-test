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
    home: { 
      pos: [10, 2, 16],       // Low water-level start
      look: [-10, 4, -12]     // Looking through the single door
    },
    collection: { 
      pos: [-85, 3.5, 45],    // Gliding out and across
      look: [-115, 3, -15]    
    } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.025); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.025);
    camera.lookAt(targetLook);
    
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.4;
    }
  });

  return (
    <>
      <Sky sunPosition={[10, 0.5, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 10, 135]} />
      
      <PinkClouds />

      {/* --- THE MONOLITHIC ROOM WITH ONE DOOR --- */}
      <group position={[0, 0, -5]} scale={0.6}>
        
        {/* BACK WALL PIECES (Constructing the Doorway) */}
        <group position={[0, 15, -12]}>
          {/* Left Side of Wall */}
          <mesh position={[-20, 0, 0]}>
            <boxGeometry args={[30, 30, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          {/* Right Side of Wall */}
          <mesh position={[20, 0, 0]}>
            <boxGeometry args={[30, 30, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          {/* Header (Top of Door) */}
          <mesh position={[0, 11, 0]}>
            <boxGeometry args={[10, 8, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* SIDE WALL (Keeps it feeling "Enclosed") */}
        <mesh position={[-35, 15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[30, 30, 4]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>
      </group>

      {/* --- GRAND STAIRS DESCENDING --- */}
      <group position={[-110, 0, -5]} scale={0.8}>
        <mesh position={[0, 6, -10]} castShadow receiveShadow>
          <boxGeometry args={[45, 1.5, 22]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
        </mesh>

        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, (4 - i) * 1.2, i * 5.5]} castShadow receiveShadow>
            <boxGeometry args={[40, 1.2, 10]} />
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