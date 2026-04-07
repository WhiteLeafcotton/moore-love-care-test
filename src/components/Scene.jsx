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
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.3;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 30, 200]} />
      
      <group position={[0, 0, -5]} scale={0.75}>
        
        {/* --- BACK WALL (TRAVERTINE) --- */}
        <group position={[0, 85, -12]}> 
          {/* Far Left Pillar */}
          <mesh position={[-48, 0, 0]}>
            <boxGeometry args={[12, 180, 0.2]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* WINDOW ENCLOSURE: Header and Sill to frame the window */}
          <mesh position={[-38.5, -30, 0]}> 
            <boxGeometry args={[7, 100, 0.2]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
          <mesh position={[-38.5, 45, 0]}> {/* WINDOW TOP */}
            <boxGeometry args={[7, 50, 0.2]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* Center Wall Section */}
          <mesh position={[-14, 0, 0]}>
            <boxGeometry args={[36, 180, 0.2]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* MAIN DOORWAY HEADER: Lowered to be visible in camera */}
          <mesh position={[8, 45, 0]}> 
            <boxGeometry args={[8, 50, 0.2]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>

          {/* Far Right Wall */}
          <mesh position={[28, 0, 0]}>
            <boxGeometry args={[32, 180, 0.2]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* --- SIDE WALL (PINK STONE) --- */}
        <group position={[-54, 85, 20]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]}>
            <boxGeometry args={[35, 180, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          
          {/* SIDE DOOR HEADER: Lowered to frame the doorway top */}
          <mesh position={[0, 45, 0]}>
            <boxGeometry args={[5, 50, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          <mesh position={[20, 0, 0]}>
            <boxGeometry args={[35, 180, 0.2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* ANCHOR BENCH */}
        <mesh position={[-25, 2.5, -6]} castShadow receiveShadow>
          <boxGeometry args={[65, 5, 15]} /> 
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