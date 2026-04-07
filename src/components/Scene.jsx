import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// ☁️ Component for Moving Pink Clouds
function MovingClouds() {
  const cloudRef = useRef();
  useFrame((state) => {
    cloudRef.current.children.forEach((cloud, i) => {
      cloud.position.x += Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.005;
      cloud.position.z += Math.cos(state.clock.elapsedTime * 0.2 + i) * 0.005;
    });
  });

  return (
    <group ref={cloudRef}>
      {[...Array(12)].map((_, i) => (
        <mesh key={i} position={[Math.random() * 150 - 75, 25 + Math.random() * 15, -60 - Math.random() * 50]}>
          <sphereGeometry args={[12, 16, 16]} />
          <meshStandardMaterial color="#fcd7d7" transparent opacity={0.3} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  const baseUrl = import.meta.env.BASE_URL || "/";
  const stoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (stoneTex) {
      stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
      stoneTex.repeat.set(2, 2);
    }
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [stoneTex, waterNormals]);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[10, 5, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#fcd7d7", 20, 150]} />
      
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.4} />

      <MovingClouds />

      {/* --- GRASSY HILLS (BACKGROUND) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -70]}>
        <planeGeometry args={[300, 150, 32, 32]} />
        <meshStandardMaterial color="#4d5d30" roughness={1} />
      </mesh>

      {/* --- REFINED PORTAL STRUCTURE (HOME VIEW) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        {/* The Portal Wall */}
        <mesh position={[0, 10, 0]} castShadow>
          <ringGeometry args={[5, 18, 64]} /> 
          <meshStandardMaterial map={stoneTex} color="#f2dcd5" side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
        
        {/* Floating Top Beam */}
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          <mesh position={[6, 18, -3]} castShadow>
            <boxGeometry args={[18, 4, 3]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
        </Float>

        {/* Floating Steps leading to portal */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[i * 1.5 - 3, i * 1, 6]} castShadow>
            <boxGeometry args={[5, 0.6, 2.5]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
        ))}

        <Float speed={1.5} floatIntensity={2}>
          <mesh position={[-8, 14, 4]}>
            <sphereGeometry args={[3, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" speed={2} distort={0.2} transmission={1} 
              thickness={2} roughness={0.02} iridescence={1.2}
            />
          </mesh>
        </Float>
      </group>

      {/* --- REFINED DOORWAY (COLLECTION VIEW) --- */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        <group position={[0, 12, 0]}>
          <mesh position={[-7, 0, 0]} castShadow>
            <boxGeometry args={[4, 32, 4]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
          <mesh position={[7, 0, 0]} castShadow>
            <boxGeometry args={[4, 32, 4]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
          <mesh position={[0, 14, 0]} castShadow>
            <boxGeometry args={[18, 4, 4]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
        </group>
      </group>

      {/* --- WATER SURFACE (KEPT ORIGINAL) --- */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 1.5, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.25} scale={200} blur={3} far={40} />
    </>
  );
}