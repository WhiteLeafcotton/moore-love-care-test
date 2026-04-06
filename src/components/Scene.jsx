import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Float, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  // 🎥 COORDINATES: Home (Right) -> Collection (Left)
  const views = {
    home: { pos: [18, 2, 18], look: [0, 0, 0] },
    collection: { pos: [-22, 5, 15], look: [-30, 0, -10] } 
  };

  // State-tracking for the camera's gaze
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const waterNormals = useMemo(() => 
    new THREE.TextureLoader().load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg", (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }), []);

  useFrame((state, delta) => {
    // 🎥 THE CINEMATIC PAN (LEFT)
    const target = views[currentView];
    
    // Smoothly slide the camera position
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    
    // Smoothly pivot the camera gaze
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);

    // Constant water ripple speed
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Environment preset="dawn" background blur={0.8} />
      <fog attach="fog" args={["#1a1a1a", 5, 75]} />
      <spotLight position={[20, 20, 10]} intensity={2.5} castShadow color="#fff4e0" />

      {/* --- 🏠 STRUCTURE 1 (ORIGINAL HOME VIEW) --- */}
      <group position={[0, 0, -5]} rotation={[0, -Math.PI / 4, 0]}>
        <group position={[5, 10, -5]}>
          <mesh castShadow><boxGeometry args={[15, 25, 10]} /><meshStandardMaterial color="#ede2df" /></mesh>
          <mesh position={[2, -4, 5.1]}><boxGeometry args={[4, 12, 0.2]} /><meshStandardMaterial color="#b5adaa" /></mesh>
        </group>
        <group position={[-5, 0, 0]}>
          <mesh position={[0, 12.5, -2.5]} castShadow><boxGeometry args={[5, 25, 5]} /><meshStandardMaterial color="#ede2df" /></mesh>
          {[-4, 1].map((z, i) => (
            <mesh key={i} position={[2.6, 8, z]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[4.5, 0.4, 16, 100, Math.PI]} /><meshStandardMaterial color="#dcd3d1" />
            </mesh>
          ))}
        </group>
        <group position={[0, -0.05, 0]}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} position={[0, i * 0.4, i * -1.5]} castShadow>
              <boxGeometry args={[30, 0.25, 2]} /><meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          ))}
        </group>
        <Float speed={1.2} floatIntensity={0.5}>
          <mesh position={[6, 11, -1]}>
            <sphereGeometry args={[3.5, 64, 64]} />
            <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={2} roughness={0.05} />
          </mesh>
        </Float>
      </group>

      {/* --- 🏗️ STRUCTURE 2 (SECOND ARCHITECTURAL VIEW) --- */}
      {/* Positioned far to the left (-50) to ensure a full camera travel */}
      <group position={[-50, 0, -12]} rotation={[0, -Math.PI / 8, 0]}>
        <mesh castShadow position={[0, 15, 0]}>
          <boxGeometry args={[10, 30, 10]} />
          <meshStandardMaterial color="#ede2df" />
        </mesh>
        <mesh castShadow position={[10, 8, 0]}>
          <boxGeometry args={[6, 16, 6]} />
          <meshStandardMaterial color="#dcd3d1" />
        </mesh>
        <Float speed={2.5}>
          <mesh position={[0, 34, 0]}>
            <sphereGeometry args={[2.5, 32, 32]} />
            <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={1} />
          </mesh>
        </Float>
      </group>

      {/* 🌊 GLOBAL WATER (ONE SURFACE FOR THE ENTIRE WORLD) */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2500, 2500), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(), sunColor: 0xffffff, 
          waterColor: 0x111111, distortionScale: 1.5, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.4} scale={200} blur={2.5} far={30} />
    </>
  );
}