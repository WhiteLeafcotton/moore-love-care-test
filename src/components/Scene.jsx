import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

function PinkClouds() {
  const cloudsRef = useRef();
  useFrame((state) => {
    cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.08) * 2;
  });

  return (
    <group ref={cloudsRef}>
      <mesh position={[-25, 30, -70]}>
        <sphereGeometry args={[22, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.12} fog={false} />
      </mesh>
      <mesh position={[35, 40, -90]}>
        <sphereGeometry args={[28, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.12} fog={false} />
      </mesh>
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
    if (travertineTex) travertineTex.repeat.set(4, 2);
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  // 🔥 WATER-LEVEL CAMERA: Very low Y (2.0) to feel "submerged" in the scene
  const views = {
    home: { 
      pos: [10, 2, 15],       // Right on the water
      look: [-8, 4, -10]      // Looking through the U-shape toward the horizon
    },
    collection: { 
      pos: [-70, 4, 45],      // Low-angle glide over the water
      look: [-110, 3, -15]    // Looking up at the descending stairs
    } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.025); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.025);
    camera.lookAt(targetLook);
    
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.4;
    }
  });

  return (
    <>
      <Sky sunPosition={[10, 0.5, 20]} turbidity={0.1} rayleigh={2} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 10, 130]} />
      
      <PinkClouds />

      {/* --- THE U-SHAPED COURTYARD (OPEN BUT ENCLOSED) --- */}
      <group position={[0, 0, -5]} scale={0.6}>
        {/* 1. Extended Back Wall (Travertine) */}
        <mesh position={[5, 15, -15]} castShadow receiveShadow>
          <boxGeometry args={[60, 30, 2]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>
        
        {/* 2. Left Wing Wall (Pink Stone) */}
        <mesh position={[-25, 15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[30, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
        </mesh>

        {/* 3. Right Wing Wall (Travertine) - Completes the "Room" feel */}
        <mesh position={[35, 15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[30, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
        </mesh>

        {/* GROUNDED ARCHITECTURAL PEDESTAL */}
        <group position={[-10, 0, 6]}>
          <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
            <boxGeometry args={[28, 1, 20]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
          <mesh position={[0, 1.8, -2]} castShadow receiveShadow>
            <boxGeometry args={[20, 1.6, 12]} />
            <meshStandardMaterial map={travertineTex} color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* --- COLLECTION AREA: GRAND STAIRS DESCENDING TO WATER --- */}
      <group position={[-115, 0, -5]} scale={0.8}>
        <mesh position={[0, 6, -10]} castShadow receiveShadow>
          <boxGeometry args={[45, 1.5, 22]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
        </mesh>

        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, (4 - i) * 1.2, i * 5.5]} castShadow receiveShadow>
            <boxGeometry args={[40, 1.2, 10]} />
            <meshStandardMaterial map={travertineTex} color="#ffffff" />
          </mesh>
        ))}
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