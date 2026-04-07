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
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; }
    });
    // Keeping your original texture scaling
    if (travertineTex) travertineTex.repeat.set(1.5, 15); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1.5, 15);
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
    // Smooth water speed from your original
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 30, 200]} />
      
      {/* ANCHORING TO WATER:
        By setting the group Y to 15 and geometry height to 30, 
        the bottom edge is exactly at 0 (the water surface).
      */}
      <group position={[0, 15, -12]} scale={0.75}>
        
        {/* --- BACK WALL (Travertine) --- */}
        
        {/* Left Corner Pillar */}
        <mesh position={[-48, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 30, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
        </mesh>

        {/* THE WINDOW CUTOUT (Sill & Header) */}
        <mesh position={[-38.5, -7.5, 0]} castShadow receiveShadow> 
          <boxGeometry args={[7, 15, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        <mesh position={[-38.5, 10, 0]} castShadow> 
          <boxGeometry args={[7, 10, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Main Display Wall */}
        <mesh position={[-14, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[36, 30, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
        </mesh>

        {/* MAIN DOORWAY HEADER */}
        <mesh position={[8, 10, 0]} castShadow>
          <boxGeometry args={[8, 10, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Right Wall Slab */}
        <mesh position={[28, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[32, 30, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
        </mesh>

        {/* --- SIDE WALL (Pink Stone) --- */}
        <group position={[-54, 0, 32]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]} castShadow>
            <boxGeometry args={[35, 30, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
          
          {/* SIDE DOOR HEADER */}
          <mesh position={[0, 10, 0]} castShadow>
            <boxGeometry args={[5, 10, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          <mesh position={[20, 0, 0]} castShadow>
            <boxGeometry args={[35, 30, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
        </group>

        {/* BENCH - Lowered to intersect the water line for a grounded look */}
        <mesh position={[-18, -13.5, -5]} castShadow receiveShadow>
          <boxGeometry args={[50, 3.5, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.7} />
        </mesh>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.3, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]} 
      />
      
      <ContactShadows opacity={0.5} scale={100} blur={2.5} far={10} color="#5e4d4d" />
    </>
  );
}