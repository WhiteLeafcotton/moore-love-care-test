import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Float, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  const views = {
    home: { pos: [18, 2, 18], look: [0, 0, 0] },
    collection: { pos: [-24, 6, 18], look: [-45, 2, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const waterNormals = useMemo(() => 
    new THREE.TextureLoader().load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg", (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }), []);

  useFrame((state, delta) => {
    // 🎥 LOCKED TRANSITION
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);

    // 🌊 LOCKED WATER
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Environment preset="dawn" background blur={0.8} />
      <fog attach="fog" args={["#1a1a1a", 5, 80]} />
      <spotLight position={[20, 20, 10]} intensity={2.5} castShadow color="#fff4e0" />

      {/* --- 🏠 STRUCTURE 1 (HOME) --- */}
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

      {/* --- 🏗️ THE NEW "DREAMSCAPES" COLLECTION (STRUCTURE 2) --- */}
      <group position={[-50, 0, -10]} rotation={[0, -Math.PI / 10, 0]}>
        
        {/* Main Archway Element */}
        <mesh position={[0, 8, 0]} castShadow>
          <boxGeometry args={[12, 16, 2]} />
          <meshStandardMaterial color="#ede2df" />
        </mesh>
        <mesh position={[0, 7, 0.1]}>
          <cylinderGeometry args={[4, 4, 3, 32]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#1a1a1a" /> {/* The "Portal" cutout look */}
        </mesh>

        {/* Floating Vertical Frames (from reference) */}
        {[ -8, 8 ].map((x, i) => (
          <Float key={i} speed={2} rotationIntensity={0.2} position={[x, 10, 5]}>
            <mesh castShadow>
              <boxGeometry args={[5, 8, 0.5]} />
              <meshPhysicalMaterial 
                color="#ffffff" 
                transmission={0.5} 
                thickness={1} 
                roughness={0.1} 
              />
            </mesh>
          </Float>
        ))}

        {/* Textured Architectural Block */}
        <mesh position={[12, 4, -5]} castShadow>
          <boxGeometry args={[8, 12, 8]} />
          <meshStandardMaterial color="#dcd3d1" roughness={0.9} />
        </mesh>

        {/* Soft Lighting Orb */}
        <Float speed={3} floatIntensity={1}>
          <mesh position={[-10, 15, -2]}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial emissive="#fff4e0" emissiveIntensity={2} color="#ffffff" />
          </mesh>
        </Float>
      </group>

      {/* 🌊 GLOBAL WATER */}
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