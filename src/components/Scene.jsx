import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  // 🎥 CAMERA COORDINATES (LOCKED)
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 8, 20], look: [-55, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // 🎨 PATH HANDLING (Fixes GitHub Pages 404s)
  const baseUrl = import.meta.env.BASE_URL || "/";
  
  // Load Stone Texture
  const stoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  useMemo(() => {
    if (stoneTex) {
      stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
      stoneTex.repeat.set(4, 4);
    }
  }, [stoneTex]);

  // Load Water Normals
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  useMemo(() => {
    if (waterNormals) {
      waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    }
  }, [waterNormals]);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.04); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.04);
    camera.lookAt(targetLook);
    
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.2;
    }
  });

  return (
    <>
      {/* 🌅 REALISTIC PINK SKY */}
      <Sky 
        distance={450000} 
        sunPosition={[10, 0.5, 20]} // Lower sun for pinker horizon
        inclination={0} 
        azimuth={0.25} 
        mieCoefficient={0.005} 
        mieDirectionalG={0.8} 
        turbidity={15} 
      />
      
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f5eae8", 10, 110]} />
      
      <directionalLight position={[10, 15, 5]} intensity={1.2} color="#ffebd1" castShadow />
      <ambientLight intensity={0.5} />

      {/* --- 🏠 STRUCTURE 1 (HOME) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <meshStandardMaterial map={stoneTex} color="#f5eae8" roughness={1} />
        </mesh>
      </group>

      {/* --- 🚪 STRUCTURE 2 (DOORWAY) --- */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        <mesh position={[0, 12, 0]} castShadow>
          <boxGeometry args={[20, 30, 4]} />
          <meshStandardMaterial map={stoneTex} color="#f5eae8" roughness={1} />
        </mesh>
        
        {/* Floating Steps */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 1.5, 10 - i * 4]} castShadow>
            <boxGeometry args={[8, 0.5, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={1} />
          </mesh>
        ))}

        {/* 🔮 IRIDESCENT SPHERE IN WATER */}
        <Float speed={2} floatIntensity={1} position={[-8, 1, 14]}>
          <mesh castShadow>
            <sphereGeometry args={[3.5, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" speed={3} distort={0.2} transmission={1} 
              thickness={1} roughness={0.01} iridescence={1.2}
            />
          </mesh>
        </Float>
      </group>

      {/* 🌊 FLUSHED PINK WATER */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(3000, 3000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 5), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 2, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      
      <ContactShadows opacity={0.4} scale={150} blur={2.5} far={40} color="#f5eae8" />
    </>
  );
}