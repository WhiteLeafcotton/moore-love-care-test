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
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(1, 15);
    }
    if (travertineTex) {
      travertineTex.wrapS = travertineTex.wrapT = THREE.RepeatWrapping;
      travertineTex.repeat.set(2, 15);
    }
    if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { 
      pos: [18, 2.2, 26],     
      look: [-16, 4, -5]    
    },
    collection: { 
      pos: [-110, 3, 55],     
      look: [-140, 2, -15]    
    } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.02); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.02);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.35;
  });

  return (
    <>
      <Sky sunPosition={[10, 0.05, -20]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 20, 200]} />

      {/* --- LOCATION 1: THE MONOLITH --- */}
      <group position={[0, 0, -5]} scale={0.7}>
        
        {/* BACK WALL (Travertine) with Offset Window */}
        <group position={[0, 75, -12]}> 
          {/* 1. Corner Pillar (Now wider to push the window away from the corner) */}
          <mesh position={[-45, 0, 0]}>
            <boxGeometry args={[10, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* WINDOW GAP: Empty space between -40 and -32 */}

          {/* 2. Main Wall Slab */}
          <mesh position={[-16, 0, 0]}>
            <boxGeometry args={[32, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* DOORWAY GAP: Empty space between -3 and 3 */}

          {/* 3. Right Wall Slab */}
          <mesh position={[24, 0, 0]}>
            <boxGeometry args={[42, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* Headers */}
          <mesh position={[-36, 70, 0]}> {/* Above Offset Window */}
            <boxGeometry args={[8, 40, 4.1]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          <mesh position={[3, 70, 0]}> {/* Above Main Door */}
            <boxGeometry args={[12, 40, 4.1]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* SIDE WALL (Pink Stone) - Slender Door Cutout */}
        <group position={[-50, 75, 15]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]}>
            <boxGeometry args={[30, 180, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[20, 0, 0]}>
            <boxGeometry args={[40, 180, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[0, 70, 0]}>
            <boxGeometry args={[10, 40, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BUILT-IN BENCH (Locked to Pink Stone Wall) */}
        <mesh position={[-24, 2, -6]} castShadow receiveShadow>
          <boxGeometry args={[58, 4, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 1.2, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
      
      <ContactShadows opacity={0.3} scale={250} blur={3} far={50} color="#5e4d4d" />
    </>
  );
}