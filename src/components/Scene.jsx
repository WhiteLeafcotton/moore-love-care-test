import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  
  // 🎥 COORDINATES (LOCKED)
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // 📦 TEXTURE LOADING
  const [wallTexture, waterNormals] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const textures = [
      // 1. Procedural Stucco for walls
      loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lava/lavatile.jpg", (t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5,5); 
          // We will tint this lava texture to be sandy/off-white in the material
      }),
      // 2. Water normals
      loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg", (t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
      })
    ];
    return textures;
  }, []);

  useFrame((state, delta) => {
    // 🎥 SMOOTH PANNING
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    
    // 🌊 WATER ANIMATION
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f0e1df", 10, 95]} />
      
      <spotLight position={[30, 20, 10]} intensity={1.2} castShadow color="#ffebd1" />
      <ambientLight intensity={0.5} />

      {/* --- 🌌 CUSTOM ETHEREAL SKY SPHERE --- */}
      {/* Replaces procedural Sky with a fixed gradient matching the reference pink/purple hase */}
      <mesh scale={5000} rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial 
          side={THREE.BackSide} 
          map={new THREE.TextureLoader().load("https://res.cloudinary.com/dzx6x1/image/upload/v1642131908/ethereal_gradient_x9j7vx.jpg")} 
        />
      </mesh>

      {/* --- 🌄 DISTANT ROLLING DUNES (Pink/Purple Landscape) --- */}
      <group position={[0, -5, -60]}>
        {[1, 2, 3].map(i => (
          <mesh key={i} position={[ (i - 2) * 80, 0, 0 ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[120, 120, 64, 64]} />
            {/* Using displacement to create the dunes */}
            <meshStandardMaterial 
              color="#f4e1f5" // Soft pink-purple tint
              roughness={1}
              displacementMap={new THREE.TextureLoader().load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/heightmap.png")}
              displacementScale={20}
              displacementBias={-10}
            />
          </mesh>
        ))}
      </group>

      {/* --- 🏠 STRUCTURE 1 (HOME VIEW) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          {/* Sandy textured material (lava tint) */}
          <meshStandardMaterial 
            color="#ede2df" 
            map={wallTexture} // Apply texture
            roughness={0.9} 
          />
        </mesh>
        <mesh position={[0, 8, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 2.5, 32]} />
          <meshStandardMaterial color="#dcd3d1" />
        </mesh>
        
        {/* Iridescent sphere 1 (Floating at Home) */}
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
      {/* Textures and elements updated based on Unseen Studio reference */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        
        {/* Floating Architectural Rock / Boulder */}
        <Float speed={1}>
          <mesh position={[-14, 5, 10]} castShadow>
            <dodecahedronGeometry args={[5, 4]} />
            <meshStandardMaterial 
              color="#dcd3d1" 
              map={wallTexture} // Applied sandy texture to rock
              roughness={1} 
            />
          </mesh>
        </Float>

        {/* The Doorway Frame */}
        <group position={[0, 12, 0]}>
          <mesh position={[-6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial color="#ede2df" map={wallTexture} roughness={0.8} />
          </mesh>
          <mesh position={[6, 0, 0]} castShadow>
            <boxGeometry args={[4, 30, 4]} />
            <meshStandardMaterial color="#ede2df" map={wallTexture} roughness={0.8} />
          </mesh>
          <mesh position={[0, 13, 0]} castShadow>
            <boxGeometry args={[16, 4, 4]} />
            <meshStandardMaterial color="#ede2df" map={wallTexture} roughness={0.8} />
          </mesh>
        </group>

        {/* Floating Steps */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 1.5, 8 - i * 4]} castShadow>
            <boxGeometry args={[8, 0.5, 6]} />
            <meshStandardMaterial color="#ffffff" map={wallTexture} roughness={0.9} />
          </mesh>
        ))}

        {/* Iridescent Sphere 2 (RESTING IN WATER) */}
        <mesh position={[10, 2, -10]}>
          <sphereGeometry args={[3.5, 64, 64]} />
          <MeshDistortMaterial 
              color="#ffffff" speed={1} distort={0.1} transmission={1} 
              thickness={2} roughness={0.02} iridescence={1}
            />
        </mesh>

        {/* Tall Needle */}
        <mesh position={[16, 15, -15]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 40, 32]} />
          <meshStandardMaterial color="#dcd3d1" />
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