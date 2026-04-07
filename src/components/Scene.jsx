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

  // Textures
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) { 
        t.wrapS = t.wrapT = THREE.RepeatWrapping; 
        t.anisotropy = 16; 
      }
    });
    // Adjusting scale to look like high-end slab marble
    if (travertineTex) travertineTex.repeat.set(1, 4);
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  // Camera views - FOV 28 for that editorial zoom
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
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      
      {/* STRUCTURAL CONTAINER 
          Positioned at Y: 17.5 so that 35-unit tall pillars rest exactly at Y: 0 (Water Level) 
      */}
      <group position={[0, 17.5, -12]} scale={0.75}>
        
        {/* --- BACK WALL (TRAVERTINE) --- */}
        
        {/* Far Left Pillar */}
        <mesh position={[-48, 0, 0]}>
          <boxGeometry args={[12, 35, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* FULLY FRAMED WINDOW - Positioned to float above bench */}
        <mesh position={[-38.5, -10, 0]}> {/* Bottom Sill */}
          <boxGeometry args={[7, 15, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        <mesh position={[-38.5, 12.5, 0]}> {/* Top Header (Lintel) */}
          <boxGeometry args={[7, 10, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Main Center Wall */}
        <mesh position={[-14, 0, 0]}>
          <boxGeometry args={[36, 35, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* MAIN DOORWAY TOP - Creates the framed opening */}
        <mesh position={[8, 12.5, 0]}>
          <boxGeometry args={[8, 10, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Right Wall Section */}
        <mesh position={[28, 0, 0]}>
          <boxGeometry args={[32, 35, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* --- SIDE WALL (PINK STONE) --- */}
        <group position={[-54, 0, 32]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]}>
            <boxGeometry args={[35, 35, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          
          <mesh position={[0, 12.5, 0]}> {/* Side Door Header */}
            <boxGeometry args={[5, 10, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          <mesh position={[20, 0, 0]}>
            <boxGeometry args={[35, 35, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BENCH - Sitting on the water */}
        <mesh position={[-18, -15.5, -5]} castShadow receiveShadow>
          <boxGeometry args={[50, 4, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* WATER - Level at Y: 0 */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.4, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      />

      <ContactShadows opacity={0.4} scale={100} blur={2} far={10} color="#000000" />
    </>
  );
}