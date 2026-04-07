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
  }, [pinkStoneTex, travertineTex, waterNormals]);

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
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      
      {/* GROUNDING THE STRUCTURE:
        Group is at Y: 12. Pillars are 30 units tall. 
        30 / 2 = 15. Since 15 > 12, the bottom 3 units are SUBMERGED.
        This ensures no floating gaps even when the water ripples.
      */}
      <group position={[0, 12, -12]} scale={0.75}>
        
        {/* --- BACK WALL (TRAVERTINE SLAB) --- */}
        
        {/* Left Section (Combined Pillar + Window Frame to fix the 'slit') */}
        <group position={[-43, 0, 0]}>
            {/* The Solid Left Side */}
            <mesh position={[-5, 0, 0]}>
                <boxGeometry args={[12, 30, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            {/* The Window Cutout (Sill & Header merged to the pillar) */}
            <mesh position={[4.5, -7.5, 0]}> 
                <boxGeometry args={[7, 15, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            <mesh position={[4.5, 10, 0]}> 
                <boxGeometry args={[7, 10, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
        </group>

        {/* Center Pillar */}
        <mesh position={[-14, 0, 0]}>
          <boxGeometry args={[36, 30, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Doorway Header (Lintel) */}
        <mesh position={[8, 10, 0]}>
          <boxGeometry args={[8, 10, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Right Pillar */}
        <mesh position={[28, 0, 0]}>
          <boxGeometry args={[32, 30, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* --- SIDE WALL (PINK STONE SLAB) --- */}
        <group position={[-55, 0, 32]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]}>
            <boxGeometry args={[35, 30, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[0, 10, 0]}> {/* Side Door Top */}
            <boxGeometry args={[5, 10, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={20, 0, 0}>
            <boxGeometry args={[35, 30, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BENCH - Partially Submerged for that "Unseen" heavy anchor */}
        <mesh position={[-18, -13, -5]} castShadow receiveShadow>
          <boxGeometry args={[50, 4, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* WATER SURFACE AT Y: 0 */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.2, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]} 
      />

      <ContactShadows opacity={0.6} scale={100} blur={3} far={10} color="#000000" />
    </>
  );
}