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
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        // High-end subtle gloss
        t.anisotropy = 16;
      }
    });
    if (travertineTex) travertineTex.repeat.set(1.5, 12); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1.5, 12);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { 
      pos: [22, 2.8, 28],     // Pushed back slightly for that wider editorial crop
      look: [-18, 4.5, -5]    
    },
    collection: { 
      pos: [-110, 3, 55],      
      look: [-140, 2, -10]    
    } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.025); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.025);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.3;
  });

  return (
    <>
      {/* LIGHTING SETUP: 
        Low sun position to create the warm, horizontal light rays 
        seen in your reference image.
      */}
      <Sky sunPosition={[-30, 0.08, 15]} turbidity={0.02} rayleigh={4} mieCoefficient={0.005} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 30, 220]} />
      
      <directionalLight 
        position={[-50, 5, 20]} 
        intensity={1.8} 
        color="#fff4f0" 
        castShadow 
      />

      {/* --- THE PRIMARY MONOLITH --- */}
      <group position={[0, 0, -5]} scale={0.75}>
        
        {/* BACK WALL (Travertine) with True Air Gaps */}
        <group position={[0, 80, -12]}> 
          {/* Left Anchor */}
          <mesh position={[-48, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
          </mesh>

          {/* WINDOW GAP: Near the corner, not in it */}

          {/* Main Display Wall (Centers the UI text) */}
          <mesh position={[-14, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[36, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
          </mesh>

          {/* MAIN DOORWAY GAP */}

          {/* Right Wall Slab */}
          <mesh position={[28, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[32, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
          </mesh>

          {/* High Headers to lock in the doorway shapes */}
          <mesh position={[-38, 75, 0]}>
            <boxGeometry args={[8, 30, 4.1]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          <mesh position={[8, 75, 0]}>
            <boxGeometry args={[8, 30, 4.1]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* SIDE WALL (Pink Stone) - Massive and Continuous */}
        <group position={[-54, 80, 15]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]} castShadow>
            <boxGeometry args={[35, 180, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
          <mesh position={[25, 0, 0]} castShadow>
            <boxGeometry args={[35, 180, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
          <mesh position={[2.5, 75, 0]}>
            <boxGeometry args={[10, 30, 4.1]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BUILT-IN BENCH: Extended to anchor the scene */}
        <mesh position={[-22, 2.5, -6]} castShadow receiveShadow>
          <boxGeometry args={[65, 5, 15]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.7} />
        </mesh>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.8, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
      
      <ContactShadows opacity={0.3} scale={250} blur={3} far={50} color="#5e4d4d" />
    </>
  );
}