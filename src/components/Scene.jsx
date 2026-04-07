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

  // Adjusted camera views for a tighter, more symmetrical frame
  const views = {
    home: { pos: [18, 3, 30], look: [-8, 4, -5] },
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
      
      {/* Group centered and tightened for cinematic balance */}
      <group position={[0, 4, -10]} scale={0.8}>
        
        {/* --- BACK WALL (Travertine) --- */}
        
        {/* LEFT WINDOW SECTION: Brought inward for a more compact frame */}
        <group position={[-32, 0, 0]}>
            <mesh position={[-5, 0, 0]}>
                <boxGeometry args={[15, 40, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            <mesh position={[5.5, -7, 0]}> 
                <boxGeometry args={[7, 14, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            <mesh position={[5.5, 13, 0]}> 
                <boxGeometry args={[7, 14, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
        </group>

        {/* MIDDLE WALL: Narrowed to pull the whole structure together */}
        <mesh position={[-8, 0, 0]}>
          <boxGeometry args={[25, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* MAIN DOORWAY: Now tighter and more centered to the logo */}
        <mesh position={[7.5, 13, 0]}>
          <boxGeometry args={[8, 14, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* RIGHT PILLAR: Balanced with the left side */}
        <mesh position={[25, 0, 0]}>
          <boxGeometry args={[28, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* --- SIDE WALL (Pink Stone) --- */}
        <group position={[-40, 0, 25]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-15, 0, 0]}>
            <boxGeometry args={[25, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[2, 13, 0]}> 
            <boxGeometry args={[9, 14, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[18, 0, 0]}>
            <boxGeometry args={[25, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BENCH: Moved back slightly to frame the "floor" space */}
        <mesh position={[-5, -13, -5]} castShadow receiveShadow>
          <boxGeometry args={[45, 4, 10]} /> 
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