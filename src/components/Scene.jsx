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
    if (travertineTex) travertineTex.repeat.set(2, 10); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 10);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { 
      pos: [15, 2.5, 20],     
      look: [-12, 4, -8]    
    },
    collection: { 
      pos: [-95, 4, 50],      
      look: [-120, 2, -10]    
    } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.025); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.025);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Sky sunPosition={[10, 0.2, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 10, 160]} />

      {/* --- LOCATION 1: THE MONOLITH --- */}
      <group position={[0, 0, -5]} scale={0.7}>
        
        {/* BACK WALL (Travertine) with Center Doorway */}
        <group position={[0, 50, -12]}> 
          <mesh position={[-25, 0, 0]}>
            <boxGeometry args={[40, 120, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          <mesh position={[25, 0, 0]}>
            <boxGeometry args={[40, 120, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          <mesh position={[0, 40, 0]}> 
            <boxGeometry args={[10, 40, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* SIDE WALL (Pink Stone) WITH ONE SLENDER DOOR CUTOUT */}
        <group position={[-45, 50, 12]} rotation={[0, Math.PI / 2, 0]}>
          {/* Main Wall Body (Left of door) */}
          <mesh position={[-15, 0, 0]}>
            <boxGeometry args={[20, 120, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          {/* Main Wall Body (Right of door) */}
          <mesh position={[15, 0, 0]}>
            <boxGeometry args={[30, 120, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          {/* Header (Top of door) */}
          <mesh position={[-2, 40, 0]}>
            <boxGeometry args={[6, 40, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE LOCKED BENCH: Intersects the Pink Wall */}
        <mesh position={[-18.5, 2, -6]} castShadow receiveShadow>
          <boxGeometry args={[46, 4, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* --- LOCATION 2: THE FLOATING SLAB --- */}
      <group position={[-130, 1, -15]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[55, 1.5, 45]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
        </mesh>
      </group>

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