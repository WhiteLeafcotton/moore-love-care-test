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

  // Textures and Setup
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; }
    });
    // Set repeats for high-fidelity slab look
    if (travertineTex) travertineTex.repeat.set(1.2, 4); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1.2, 4);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  // Keeping your camera exactly where you like it for the symmetrical home view
  const views = {
    home: { pos: [24, 2.5, 34], look: [-12, 3.8, -5] },
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
      
      {/* Wall Container - Total Height is capped at 40 so the top is visible in the FOV */}
      <group position={[0, 18, -12]} scale={0.75}>
        
        {/* --- BACK WALL (TRAVERTINE) --- */}
        
        {/* Left Edge Pillar */}
        <mesh position={[-48, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
        </mesh>

        {/* FULLY FRAMED FLOATING WINDOW - Sill and Header create a picture frame */}
        <mesh position={[-38.5, -12, 0]} castShadow receiveShadow> {/* Sill */}
          <boxGeometry args={[7, 16, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        <mesh position={[-38.5, 14, 0]} castShadow> {/* Header */}
          <boxGeometry args={[7, 12, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Pillar 2 (Middle Wall Section) */}
        <mesh position={[-14, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[36, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
        </mesh>

        {/* MAIN DOORWAY TOP - Lowered to create the top frame */}
        <mesh position={[8, 14, 0]} castShadow>
          <boxGeometry args={[8, 12, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Pillar 3 (Right Edge) */}
        <mesh position={[28, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[32, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
        </mesh>

        {/* --- SIDE WALL (PINK STONE) --- */}
        <group position={[-54, 0, 32]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]} castShadow>
            <boxGeometry args={[35, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
          <mesh position={[0, 14, 0]} castShadow> {/* Side Door Top */}
            <boxGeometry args={[5, 12, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[20, 0, 0]} castShadow>
            <boxGeometry args={[35, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Bench (positioned so the window floats cleanly above it) */}
      <mesh position={[-18, 1.5, -15]} castShadow receiveShadow>
        <boxGeometry args={[50, 3, 12]} /> 
        <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.7} />
      </mesh>

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