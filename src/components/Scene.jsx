import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// 🏛️ True Roman Arches (3 Arches for 4 Pillars)
function RomanArches({ texture }) {
  const spacing = 18;
  const poleHeight = 30;
  
  // Create the exact arch silhouette from the reference
  const archShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Inner semi-circle
    shape.absarc(0, 0, 8, 0, Math.PI, false); 
    // Outer structure to create a flat top header
    shape.lineTo(-9, 4); 
    shape.lineTo(9, 4);  
    shape.lineTo(9, 0);  
    return shape;
  }, []);

  return (
    <group>
      {/* 4 Architectural Pillars */}
      {[...Array(4)].map((_, i) => (
        <mesh key={`pole-${i}`} position={[(i * spacing) - (spacing * 1.5), poleHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[1.5, 1.8, poleHeight, 32]} />
          <meshStandardMaterial map={texture} color="#ede2df" />
        </mesh>
      ))}

      {/* 3 Extruded Arches connecting the pillars */}
      {[...Array(3)].map((_, i) => (
        <mesh 
          key={`arch-${i}`} 
          position={[(i * spacing) - spacing + (spacing / 2) - 9, poleHeight, -1.5]} 
          castShadow
        >
          <extrudeGeometry args={[archShape, { depth: 3, bevelEnabled: false }]} />
          <meshStandardMaterial map={texture} color="#ede2df" />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // Using the exact file extension seen in your VS Code sidebar
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { pos: [22, 6, 25], look: [0, 4, 0] },
    collection: { pos: [-80, 18, 65], look: [-100, 10, -20] } 
  };
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Sky sunPosition={[10, 0.5, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      
      {/* --- STRUCTURE A: THE CORNER & FIXED BASE PLATFORM --- */}
      <group position={[0, -0.2, -5]} scale={0.6}>
        {/* Walls */}
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        <mesh position={[-21, 15, -1]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[18, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>

        {/* LOCKED PLATFORM AT THE BASE */}
        <group position={[-10, 0.6, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[22, 1.2, 15]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
        </group>
      </group>

      {/* --- STRUCTURE B: THE ROMAN SANCTUARY --- */}
      <group position={[-110, -0.2, -20]} scale={0.8}>
        <RomanArches texture={pinkStoneTex} />
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[80, 1, 20]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
      </group>

      {/* --- WATER SURFACE --- */}
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
      
      <ContactShadows opacity={0.4} scale={200} blur={2.5} far={40} color="#5e4d4d" />
    </>
  );
}