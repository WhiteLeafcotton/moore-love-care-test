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

  /* NEW INTERIOR VIEW: Starts INSIDE looking toward the corner */
  const views = {
    home: { pos: [-5, 6, 15], look: [-30, 5, -10] }, // Deep inside perspective
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
      
      {/* THE ISOMETRIC CORNER ROOM */}
      <group position={[0, 4, -12]} scale={0.8}>
        
        {/* --- BACK WALL (Travertine) with 1 DOOR & 2 WINDOWS --- */}
        <group position={[-35, 0, 0]}>
            <mesh position={[-15, 0, 0]}>
                <boxGeometry args={[10, 40, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            
            <mesh position={[-5, 13, 0]}> 
                <boxGeometry args={[10, 14, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>

            <mesh position={[5, 0, 0]}>
                <boxGeometry args={[10, 40, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>

            <mesh position={[15, 13, 0]}> <boxGeometry args={[10, 14, 2]} /> <meshStandardMaterial map={travertineTex} color="#fcd7d7" /></mesh>
            <mesh position={[15, -7, 0]}> <boxGeometry args={[10, 14, 2]} /> <meshStandardMaterial map={travertineTex} color="#fcd7d7" /></mesh>

            <mesh position={[25, 0, 0]}>
                <boxGeometry args={[10, 40, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>

            <mesh position={[35, 13, 0]}> <boxGeometry args={[10, 14, 2]} /> <meshStandardMaterial map={travertineTex} color="#fcd7d7" /></mesh>
            <mesh position={[35, -7, 0]}> <boxGeometry args={[10, 14, 2]} /> <meshStandardMaterial map={travertineTex} color="#fcd7d7" /></mesh>

            <mesh position={[45, 0, 0]}>
                <boxGeometry args={[10, 40, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
        </group>

        {/* --- RIGHT WALL (Pink Stone) with 3 DOORS --- */}
        <group position={[10, 0, 25]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-35, 0, 0]}>
            <boxGeometry args={[10, 40, 2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          
          <mesh position={[-25, 13, 0]}> <boxGeometry args={[10, 14, 2]} /> <meshStandardMaterial map={pinkStoneTex} color="#ede2df" /></mesh>
          
          <mesh position={[-15, 0, 0]}>
            <boxGeometry args={[10, 40, 2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          <mesh position={[-5, 13, 0]}> <boxGeometry args={[10, 14, 2]} /> <meshStandardMaterial map={pinkStoneTex} color="#ede2df" /></mesh>

          <mesh position={[5, 0, 0]}>
            <boxGeometry args={[10, 40, 2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          <mesh position={[15, 13, 0]}> <boxGeometry args={[10, 14, 2]} /> <meshStandardMaterial map={pinkStoneTex} color="#ede2df" /></mesh>

          <mesh position={[25, 0, 0]}>
            <boxGeometry args={[10, 40, 2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* THE LARGE BENCH: Restored and centered */}
        <mesh position={[0, -13, 5]} castShadow receiveShadow>
          <boxGeometry args={[65, 4, 15]} /> 
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