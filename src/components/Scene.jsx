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
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; }
    });
    if (travertineTex) travertineTex.repeat.set(1.5, 10); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1.5, 10);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { pos: [20, 3, 32], look: [-10, 4, -5] }, // Slightly wider home view for better symmetry
    collection: { pos: [-110, 3, 55], look: [-140, 2, -10] } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.02); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.02);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.3;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 30, 200]} />
      
      {/* GROUNDED AT Y:4 - Kept in the water as requested */}
      <group position={[0, 4, -12]} scale={0.8}>
        
        {/* --- BACK WALL (Travertine) --- */}
        
        {/* LEFT WINDOW SECTION: Overlapped to close the gap */}
        <group position={[-35, 0, 0]}>
            {/* Left Pillar */}
            <mesh position={[-6, 0, 0]}>
                <boxGeometry args={[16, 40, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            {/* Window Sill - Overlapped by 0.5 units at the join */}
            <mesh position={[5.5, -7, 0]}> 
                <boxGeometry args={[8, 14, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            {/* Window Header - Overlapped by 0.5 units at the join */}
            <mesh position={[5.5, 13, 0]}> 
                <boxGeometry args={[8, 14, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
        </group>

        {/* MIDDLE WALL: Pulling the doorway closer for better ratio */}
        <mesh position={[-11, 0, 0]}>
          <boxGeometry args={[30, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* MAIN DOORWAY: Symmetrical to the left window opening */}
        <mesh position={[8, 13, 0]}>
          <boxGeometry args={[9, 14, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* RIGHT PILLAR: Sized to balance the left side visual weight */}
        <mesh position={[29, 0, 0]}>
          <boxGeometry args={[33, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* --- SIDE WALL (Pink Stone) --- */}
        <group position={[-43, 0, 28]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-18, 0, 0]}>
            <boxGeometry args={[30, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[1, 13, 0]}> 
            <boxGeometry args={[9, 14, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[20, 0, 0]}>
            <boxGeometry args={[30, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BENCH: Centered to the main back wall structure */}
        <mesh position={[-2, -13, -5]} castShadow receiveShadow>
          <boxGeometry args={[55, 4, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
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