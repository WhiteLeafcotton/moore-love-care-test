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
      pinkStoneTex.repeat.set(1, 12);
    }
    if (travertineTex) {
      travertineTex.wrapS = travertineTex.wrapT = THREE.RepeatWrapping;
      travertineTex.repeat.set(2, 12);
    }
    if (waterNormals) {
      waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    }
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { 
      pos: [18, 1.8, 24],     
      look: [-14, 3.5, -5]    
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
    
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.35;
    }
  });

  return (
    <>
      <Sky sunPosition={[10, 0.1, 20]} turbidity={0.05} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 15, 180]} />

      {/* --- LOCATION 1: THE MONOLITH --- */}
      <group position={[0, 0, -5]} scale={0.7}>
        
        {/* BACK WALL (Travertine) - Now with a Corner Window */}
        <group position={[0, 60, -12]}> 
          {/* Far Left Piece (forms the edge of the corner window) */}
          <mesh position={[-42, 0, 0]}>
            <boxGeometry args={[6, 150, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* THE CORNER WINDOW GAP (approx 6 units wide) */}

          {/* Main Left Wall Piece */}
          <mesh position={[-18, 0, 0]}>
            <boxGeometry args={[34, 150, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* Right Wall Piece (forms the main door) */}
          <mesh position={[25, 0, 0]}>
            <boxGeometry args={[40, 150, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* Header above the Main Door */}
          <mesh position={[0, 50, 0]}> 
            <boxGeometry args={[10, 50, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* Header above the Corner Window */}
          <mesh position={[-37, 50, 0]}> 
            <boxGeometry args={[6, 50, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* SIDE WALL (Pink Stone) - Slender Door Cutout */}
        <group position={[-45, 60, 12]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-15, 0, 0]}>
            <boxGeometry args={[20, 150, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[15, 0, 0]}>
            <boxGeometry args={[30, 150, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[-2, 55, 0]}>
            <boxGeometry args={[6, 40, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BUILT-IN BENCH */}
        <mesh position={[-18.5, 2, -6]} castShadow receiveShadow>
          <boxGeometry args={[46, 4, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* --- LOCATION 2: THE FLOATING SLAB --- */}
      <group position={[-140, 1, -20]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[60, 1.2, 50]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
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