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

  // Load Textures
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
    if (travertineTex) travertineTex.repeat.set(2, 2);
    if (pinkStoneTex) pinkStoneTex.repeat.set(1, 4);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  // 🔥 RESTORED CAMERA PERSPECTIVE: Angled to clearly see the 90° corner and door
  const views = {
    home: { 
      pos: [18, 4, 18],       // Back and angled (18, 18)
      look: [-1, 3.5, -2]     // Gaze directed at the corner meeting point
    },
    collection: { 
      pos: [-75, 15, 60],     
      look: [-100, 6, -15]    
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
      <Sky sunPosition={[10, 0.5, 20]} rayleigh={2} turbidity={0.1} mieCoefficient={0.005} mieDirectionalG={0.8}/>
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 20, 160]} />
      
      <PinkClouds />

      {/* --- THE SANCTUARY ROOM (RESTORED PERSPECTIVE) --- */}
      <group position={[0, -0.2, -5]} scale={0.6}>
        
        {/* L-SHAPE ARCHITECTURE */}
        {/* Wall 1: Travertine (Back Wall - contains the doorway) */}
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 2]} />
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.8}/>
        </mesh>
        
        {/* Wall 2: Pink Stone (Side Wall - defines the 90° corner turn) */}
        <mesh position={[-21, 15, -1]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[18, 30, 2]} />
          <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.9} />
        </mesh>

        {/* LOCKED LUXURY DAIS (PINK STONE) */}
        <group position={[-10, 0.3, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[22, 0.8, 15]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
          <mesh position={[2, 0.6, 2]} castShadow>
            <boxGeometry args={[12, 0.8, 8]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
        </group>
      </group>

      {/* --- DESCENDING WATER STAIRS (TRAVERTINE) --- */}
      <group position={[-90, -0.2, -25]} scale={0.8}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[0, i * 1, i * 2.5]} castShadow receiveShadow>
            <boxGeometry args={[12, 0.8, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.7} />
          </mesh>
        ))}
        {/* Landing at top */}
        <mesh position={[0, 6, 12]} castShadow receiveShadow>
          <boxGeometry args={[14, 1.2, 6]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
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
        position={[0, -0.2, 0]}
      />
      
      <ContactShadows opacity={0.4} scale={200} blur={2.5} far={40} color="#5e4d4d" />
    </>
  );
}