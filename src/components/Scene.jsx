import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

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
    if (travertineTex) travertineTex.repeat.set(2, 4); // Stretched for taller walls
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { 
      pos: [12, 1.8, 15],      // Lower, immersive water level
      look: [-15, 4, -10]      // Angled to frame the corner and door
    },
    collection: { 
      pos: [-90, 3, 40],    
      look: [-120, 2, -20]    
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
      <Sky sunPosition={[10, 0.2, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 5, 120]} />

      {/* --- CINEMATIC ARCHITECTURE --- */}
      <group position={[0, 0, -5]} scale={0.7}>
        
        {/* BACK WALL: Tall enough to never see the top edge */}
        <group position={[0, 25, -12]}> 
          {/* Left Wall Segment */}
          <mesh position={[-25, 0, 0]}>
            <boxGeometry args={[40, 60, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          {/* Right Wall Segment */}
          <mesh position={[25, 0, 0]}>
            <boxGeometry args={[40, 60, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          {/* Header - Positioned high so the door feels massive */}
          <mesh position={[0, 15, 0]}>
            <boxGeometry args={[10, 30, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* SIDE WALL: Extended height */}
        <mesh position={[-45, 25, 10]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[50, 60, 4]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>
      </group>

      {/* --- DESCENDING STAIRS --- */}
      <group position={[-110, 0, -5]} scale={0.8}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, (4 - i) * 1.2, i * 6]} castShadow receiveShadow>
            <boxGeometry args={[45, 1.2, 10]} />
            <meshStandardMaterial map={travertineTex} color="#ffffff" />
          </mesh>
        ))}
      </group>

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