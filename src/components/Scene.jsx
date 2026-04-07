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
    // Increased repeat for a high-end, premium slab look
    if (travertineTex) travertineTex.repeat.set(1.5, 12); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1.5, 12);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  // IMAX PERSPECTIVE: Lowered Y (height) and moved Z closer to make the architecture loom heroically
  const views = {
    home: { pos: [12, 1.8, 28], look: [-10, 3, -8] },
    collection: { pos: [-110, 3, 55], look: [-140, 2, -10] } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    // Dynamic FOV adjustment for that "wide-lens" look
    camera.fov = THREE.MathUtils.lerp(camera.fov, 42, 0.02);
    camera.updateProjectionMatrix();

    camera.position.lerp(new THREE.Vector3(...target.pos), 0.02); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.02);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 20, 150]} />
      
      {/* TIGHTENED STRUCTURE GROUP */}
      <group position={[0, 4, -12]} scale={0.85}>
        
        {/* --- BACK WALL (Travertine) - TIGHTER CLUSTER --- */}
        <group position={[-30, 0, 0]}>
            {/* Left Pillar */}
            <mesh position={[-5, 0, 0]}>
                <boxGeometry args={[14, 40, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            {/* THE RECTANGLE WINDOW: Sill and Header are tightly closed */}
            <mesh position={[5.1, -8, 0]}> {/* Sill lower */}
                <boxGeometry args={[7, 12, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            <mesh position={[5.1, 14, 0]}> {/* Header lower */}
                <boxGeometry args={[7, 12, 0.2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
        </group>

        {/* Middle Wall (Shrunk to bring Door closer to Window) */}
        <mesh position={[-7.5, 0, 0]}>
          <boxGeometry args={[18, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* THINNER MAIN DOORWAY */}
        <mesh position={[5.5, 14, 0]}>
          <boxGeometry args={[8, 12, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* Right Pillar */}
        <mesh position={[21.5, 0, 0]}>
          <boxGeometry args={[24, 40, 0.2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* --- SIDE WALL (Pink Stone) - TIGHTER DOUBLE DOORS --- */}
        <group position={[-36.5, 0, 25]} rotation={[0, Math.PI / 2, 0]}>
          {/* Left Pillar */}
          <mesh position={[-18, 0, 0]}>
            <boxGeometry args={[16, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          
          {/* DOOR 1 (Narrower and closer) */}
          <mesh position={[-6, 14, 0]}> 
            <boxGeometry args={[8, 12, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          {/* Squeezed Center Pillar (Brings doors closer together) */}
          <mesh position={[2, 0, 0]}>
            <boxGeometry args={[8, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          {/* DOOR 2 (Narrower and closer) */}
          <mesh position={[10, 14, 0]}> 
            <boxGeometry args={[8, 12, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          {/* Right Pillar */}
          <mesh position={[21, 0, 0]}>
            <boxGeometry args={[14, 40, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE BENCH */}
        <mesh position={[0, -13, -5]} castShadow receiveShadow>
          <boxGeometry args={[50, 4, 12]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* ENHANCED WATER POOL */}
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