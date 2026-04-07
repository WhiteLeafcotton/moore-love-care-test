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
    // Adjusted scale for more intimate pool room textures
    if (travertineTex) travertineTex.repeat.set(1, 4); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { 
      pos: [-30, 5, 35],      
      look: [15, 2, -10]    
    },
    collection: { 
      pos: [60, 3, 15], 
      look: [120, 2, 15] 
    } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    
    if (state.clock.elapsedTime < 0.1 && currentView === 'home') {
       camera.position.set(30, 10, 60); 
    }

    camera.position.lerp(new THREE.Vector3(...target.pos), 0.012); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.012);
    camera.lookAt(targetLook);
    
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.3;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 20, 150]} />
      
      <group position={[0, 4, -10]} scale={0.8}>
        
        {/* --- COMPACT BACK WALL (Travertine) --- */}
        {/* Total width reduced from 70 to 40 for intimacy */}
        <group position={[-20, 0, 0]}>
            <mesh position={[-5, 0, 0]}>
                <boxGeometry args={[10, 30, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            
            {/* Aesthetic Window Cutout */}
            <mesh position={[5, 10, 0]}> 
                <boxGeometry args={[10, 10, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            <mesh position={[5, -10, 0]}> 
                <boxGeometry args={[10, 10, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>

            <mesh position={[15, 0, 0]}>
                <boxGeometry args={[10, 30, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>

            {/* Aesthetic High Window */}
            <mesh position={[25, 10, 0]}> 
                <boxGeometry args={[10, 10, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
            <mesh position={[25, -5, 0]}> 
                <boxGeometry args={[10, 20, 2]} />
                <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
            </mesh>
        </group>

        {/* --- COMPACT RIGHT WALL (Pink Stone) --- */}
        <group position={[5, 0, 15]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-15, 0, 0]}>
            <boxGeometry args={[10, 30, 2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          
          {/* Aesthetic Doorway Framing */}
          <mesh position={[-5, 10, 0]}> 
            <boxGeometry args={[10, 10, 2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          
          <mesh position={[5, 0, 0]}>
            <boxGeometry args={[10, 30, 2]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>

          <mesh position={[15, 10, 0]}> 
            <boxGeometry args={[10, 10, 2]} /> 
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
          <mesh position={[15, -10, 0]}> 
            <boxGeometry args={[10, 10, 2]} /> 
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* CORNER PLATFORM - A raised step inside the corner */}
        <mesh position={[-5, -12, 5]} castShadow receiveShadow>
          <boxGeometry args={[25, 2, 25]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* LINING BENCH - Positioned along the back wall */}
        <mesh position={[0, -11, -2]} castShadow receiveShadow>
          <boxGeometry args={[35, 1.5, 6]} /> 
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.4, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
      <ContactShadows opacity={0.4} scale={150} blur={2.5} far={40} color="#5e4d4d" />
    </>
  );
}