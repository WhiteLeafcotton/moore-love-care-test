import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
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
    collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  const waterNormals = useMemo(() => 
    new THREE.TextureLoader().load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg", (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }), []);

  // 🎨 TEXTURE LOADER (Ensures the grainy travertine feel)
  const travertine = useMemo(() => 
    new THREE.TextureLoader().load("/textures/travertine.jpg", (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
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
      {/* 🌅 SKY: Adjusted for a pinkish/purple esky landscape feel */}
      <Sky 
        distance={450000} 
        sunPosition={[10, 0.2, 20]} // Lowered sun for more pink/purple hues
        inclination={0} 
        azimuth={0.25} 
        mieCoefficient={0.05} // Increased haze to capture pink light
        mieDirectionalG={0.9} 
        turbidity={20} // Higher turbidity = more sunset colors
      />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#e8d2ca", 10, 95]} />
      
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.4} />

      {/* --- 🏠 STRUCTURE 1 (HOME VIEW) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <meshStandardMaterial map={travertine} color="#ede2df" roughness={1} />
        </mesh>
        <mesh position={[0, 8, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 2.5, 32]} />
          <meshStandardMaterial map={travertine} color="#dcd3d1" />
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

      {/* --- 🚪 STRUCTURE 2 (DOORWAY COLLECTION VIEW) --- */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        
        {/* Architectural Doorway Frame */}
        <group position={[0, 12, 0]}>
          <mesh position={[-6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial map={travertine} color="#ede2df" roughness={0.8} />
          </mesh>
          <mesh position={[6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial map={travertine} color="#ede2df" roughness={0.8} />
          </mesh>
          <mesh position={[0, 13, 0]} castShadow>
            <boxGeometry args={[16, 4, 4]} />
            <meshStandardMaterial map={travertine} color="#ede2df" roughness={0.8} />
          </mesh>
        </group>

        {/* Floating Steps leading THROUGH the doorway */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 1.5, 8 - i * 4]} castShadow>
            <boxGeometry args={[8, 0.5, 6]} />
            <meshStandardMaterial map={travertine} color="#ffffff" roughness={0.9} />
          </mesh>
        ))}

        {/* 🔮 RESTORED SPHERE IN WATER (NESTLED IN FRONT OF DOORWAY) */}
        <Float speed={1.5} floatIntensity={0.5} position={[-8, 0.5, 12]}>
          <mesh castShadow>
            <sphereGeometry args={[3, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" speed={2} distort={0.2} transmission={1} 
              thickness={2} roughness={0.02} iridescence={1.5}
            />
          </mesh>
        </Float>

        {/* Tall Architectural Needle */}
        <mesh position={[14, 15, -5]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 40, 32]} />
          <meshStandardMaterial map={travertine} color="#dcd3d1" />
        </mesh>
      </group>

      {/* 🌊 GLOBAL WATER SURFACE */}
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