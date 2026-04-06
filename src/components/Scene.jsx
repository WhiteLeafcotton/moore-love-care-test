import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 8, 18], look: [-50, 4, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const waterNormals = useMemo(() => 
    new THREE.TextureLoader().load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg", (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      {/* 🌅 WARM SUNRISE LIGHTING */}
      <Environment preset="dawn" background blur={0.8} />
      <fog attach="fog" args={["#dcd3d1", 5, 85]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[20, 20, 10]} intensity={2} castShadow color="#ffebd1" />

      {/* --- 🏠 STRUCTURE 1 (HOME - ARCHES & STAIRS) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        {/* Main Wall with Arch */}
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <meshStandardMaterial color="#ede2df" roughness={0.9} />
        </mesh>
        <mesh position={[0, 8, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 3, 32]} />
          <meshStandardMaterial color="#dcd3d1" roughness={1} />
        </mesh>

        {/* Floating Stairs (from reference) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[2 + i, i * 0.8, 4]} castShadow>
            <boxGeometry args={[6, 0.5, 3]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>
        ))}

        {/* The Iridescent Sphere */}
        <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
          <mesh position={[-6, 12, 5]}>
            <sphereGeometry args={[3.5, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" 
              speed={2} 
              distort={0.3} 
              transmission={1} 
              thickness={2} 
              roughness={0.05} 
              iridescence={1}
            />
          </mesh>
        </Float>
      </group>

      {/* --- 🏗️ STRUCTURE 2 (COLLECTION - ORGANIC FORMS) --- */}
      <group position={[-55, -2, -10]} rotation={[0, Math.PI / 10, 0]}>
        {/* Large Rounded Portal */}
        <mesh position={[0, 12, 0]} castShadow>
          <boxGeometry args={[20, 30, 3]} />
          <meshStandardMaterial color="#ede2df" roughness={0.9} />
        </mesh>
        
        {/* Floating Organic "Rock" (from reference) */}
        <Float speed={1.2}>
          <mesh position={[12, 2, 5]} castShadow>
            <dodecahedronGeometry args={[5, 3]} />
            <meshStandardMaterial color="#dcd3d1" roughness={1} />
          </mesh>
        </Float>

        {/* Tall Slim Pillar */}
        <mesh position={[-8, 15, 6]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 35, 32]} />
          <meshStandardMaterial color="#ede2df" />
        </mesh>
      </group>

      {/* 🌊 GLOBAL WAHTER */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(), sunColor: 0xffffff, 
          waterColor: 0x9fb5bd, distortionScale: 1.8, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.2} scale={200} blur={3} far={40} />
    </>
  );
}