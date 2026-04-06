import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
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
      {/* 🌅 ENHANCED SKY: Removing purple, adding hazy sunrise */}
      <Sky 
        distance={450000} 
        sunPosition={[10, 1, 20]} 
        inclination={0} 
        azimuth={0.25} 
        mieCoefficient={0.005} 
        mieDirectionalG={0.8} 
        turbidity={10} 
      />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f2e9e4", 10, 90]} />
      
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.4} />

      {/* --- 🏠 STRUCTURE 1 (HOME) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <meshStandardMaterial color="#ede2df" roughness={0.9} />
        </mesh>
        <mesh position={[0, 8, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 2.5, 32]} />
          <meshStandardMaterial color="#dcd3d1" />
        </mesh>
        
        <Float speed={1.5} floatIntensity={2}>
          <mesh position={[-6, 12, 5]}>
            <sphereGeometry args={[3.5, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" speed={2} distort={0.2} transmission={1} 
              thickness={2} roughness={0.02} iridescence={1}
            />
          </mesh>
        </Float>
      </group>

      {/* --- 🚪 STRUCTURE 2 (ENHANCED DOORWAY) --- */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        
        {/* The Doorway Frame */}
        <group position={[0, 12, 0]}>
          {/* Left Pillar */}
          <mesh position={[-6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial color="#ede2df" roughness={0.8} />
          </mesh>
          {/* Right Pillar */}
          <mesh position={[6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial color="#ede2df" roughness={0.8} />
          </mesh>
          {/* Top Header */}
          <mesh position={[0, 13, 0]} castShadow>
            <boxGeometry args={[16, 4, 4]} />
            <meshStandardMaterial color="#ede2df" roughness={0.8} />
          </mesh>
        </group>

        {/* Floating Steps leading THROUGH the doorway */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 1.5, 8 - i * 4]} castShadow>
            <boxGeometry args={[8, 0.5, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        ))}

        {/* Tall Architectural Needle */}
        <mesh position={[14, 15, -5]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 40, 32]} />
          <meshStandardMaterial color="#dcd3d1" />
        </mesh>
      </group>

      {/* 🌊 LOCKED WATER SURFACE */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0x8ea6ad, distortionScale: 1.5, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.25} scale={200} blur={3} far={40} />
    </>
  );
}