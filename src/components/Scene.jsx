import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
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

  // Keeping your camera exactly where it was in the home view
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
      
      {/* Wall Container - Height capped to 40 so the top edge is visible */}
      <group position={[0, 18, -12]} scale={0.75}>
        
        {/* --- BACK WALL (TRAVERTINE) --- */}
        
        {/* Left Pillar */}
        <mesh position={[-48, 0, 0]}>
          <boxGeometry args={[12, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* FULLY FRAMED FLOATING WINDOW */}
        <mesh position={[-38.5, -8, 0]}> {/* Sill - Above the bench */}
          <boxGeometry args={[7, 18, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        <mesh position={[-38.5, 14, 0]}> {/* Header - Closes the top */}
          <boxGeometry args={[7, 12, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Center Wall Section */}
        <mesh position={[-14, 0, 0]}>
          <boxGeometry args={[36, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* MAIN DOORWAY TOP */}
        <mesh position={[8, 14, 0]}>
          <boxGeometry args={[8, 12, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Right Wall */}
        <mesh position={[28, 0, 0]}>
          <boxGeometry args={[32, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* --- SIDE WALL (PINK STONE) --- */}
        <group position={[-54, 0, 32]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]}>
            <boxGeometry args={[35, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[0, 14, 0]}> {/* Side Door Top */}
            <boxGeometry args={[5, 12, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[20, 0, 0]}>
            <boxGeometry args={[35, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>
      </group>

      {/* Bench (positioned slightly lower so the window is clear) */}
      <mesh position={[-18, 1.5, -15]} castShadow receiveShadow>
        <boxGeometry args={[50, 3, 12]} /> 
        <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
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
    </>
  );
}