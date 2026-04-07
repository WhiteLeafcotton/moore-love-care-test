import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, Sky, ContactShadows, useScroll } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// ☁️ Component for Moving Pink Clouds
function MovingClouds() {
  const cloudRef = useRef();
  useFrame((state) => {
    cloudRef.current.children.forEach((cloud, i) => {
      // Horizontal drift (X)
      cloud.position.x += Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.005;
      // Drifts backward (Z)
      cloud.position.z += Math.cos(state.clock.elapsedTime * 0.2 + i) * 0.005;
    });
  });

  return (
    <group ref={cloudRef}>
      {[...Array(10)].map((_, i) => (
        <mesh key={i} position={[Math.random() * 100 - 50, 20 + Math.random() * 10, -50 - Math.random() * 50]}>
          <sphereGeometry args={[15, 16, 16]} />
          <meshStandardMaterial color="#fcd7d7" transparent opacity={0.4} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = "./"; // Uses relative paths, now that folders are fixed.

  // 1. Bulletproof Load Assets
  const stoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  
  // 🌿 Load a Grass Texture (Must save this to your textures folder as grass.jpg)
  const grassTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass.jpg`);

  // 2. Wrap & Repeat Textures
  useMemo(() => {
    if (stoneTex) {
      stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
      stoneTex.repeat.set(2, 2);
    }
    if (grassTex) {
      grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
      grassTex.repeat.set(8, 8); // Tighter repeat for foreground hills
    }
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [stoneTex, grassTex, waterNormals]);

  // 3. Water Time & Original Camera Movement
  useFrame((state, delta) => {
    // Keep your camera views intact:
    const views = {
      home: { pos: [18, 2, 18], look: [0, 2, 0] },
      collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
    };
    const targetLook = new THREE.Vector3(0, 0, 0);
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);

    // Keep water moving
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      {/* Atmosphere (Sunrise/Sunset) */}
      <Sky distance={450000} sunPosition={[10, 0.5, 20]} turbidity={0.1} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#fcd7d7", 30, 150]} />
      
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.4} />

      {/* ☁️ Added Moving Clouds */}
      <MovingClouds />

      {/* --- STRUCTURE 1: THE HOME VIEW --- */}
      {/* Inspired by the inside corner with platforms from your Unseen Ref */}
      <group position={[0, -1, -10]}>
        
        {/* L-Shaped Corner Walls */}
        <mesh position={[-8, 10, 0]} castShadow>
          <boxGeometry args={[16, 22, 2]} />
          <meshStandardMaterial map={stoneTex} color="#f2dcd5" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        <mesh position={[0, 10, -8]} castShadow>
          <boxGeometry args={[2, 22, 16]} />
          <meshStandardMaterial map={stoneTex} color="#f2dcd5" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>

        {/* Large Portal with Circular Cutout (The Unseen "O") */}
        <mesh position={[-6, 12, 5]} castShadow>
          <ringGeometry args={[4, 15, 64]} /> 
          <meshStandardMaterial map={stoneTex} color="#f2dcd5" side={THREE.DoubleSide} />
        </mesh>

        {/* Floating Horizontal Platforms */}
        {[3, 11, 19].map((y, i) => (
          <Float key={i} speed={1.5 + i} rotationIntensity={0.1} floatIntensity={0.5}>
            <mesh position={[2, y, 4]} castShadow>
              <boxGeometry args={[14, 0.5, 6]} />
              <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
            </mesh>
          </Float>
        ))}
      </group>

      {/* --- STRUCTURE 2: THE COLLECTION VIEW --- */}
      {/* Floating Staircase leading to a raised doorway */}
      <group position={[-55, -1, -15]} rotation={[0, Math.PI / 8, 0]}>
        
        {/* Floating Staircase */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} position={[0, i * 1.5, i * 2.5]} castShadow>
            <boxGeometry args={[12, 0.5, 3]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
        ))}

        {/* Raised Portal at the top of the stairs */}
        <group position={[0, 15, 17]}>
          <mesh position={[-7, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
          <mesh position={[7, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
          <mesh position={[0, 13, 0]} castShadow>
            <boxGeometry args={[18, 4, 4]} />
            <meshStandardMaterial map={stoneTex} color="#f2dcd5" />
          </mesh>
        </group>
      </group>

      {/* 🌿 GRASSY HILLS (BACKGROUND) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -70]}>
        <planeGeometry args={[300, 150, 64, 64]} />
        <meshStandardMaterial map={grassTex} color="#a6b18c" roughness={1} />
      </mesh>

      {/* 🌊 ORIGINAL WATER SURFACE */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xe5d9d3, distortionScale: 1.5, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
      />
      
      <ContactShadows opacity={0.25} scale={200} blur={3} far={40} />
    </>
  );
}