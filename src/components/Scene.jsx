import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// procedural gradient sky texture (Pinkish-Purple haze)
const generateGradientSky = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  // Pink (Horizon) -> Light Purple (Zenith)
  gradient.addColorStop(0, "#e8d2ca"); 
  gradient.addColorStop(0.5, "#d2b4de");
  gradient.addColorStop(1, "#c39bd3"); 
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
};

export default function Scene({ currentView }) {
  const { camera, scene } = useThree();
  const waterRef = useRef();

  // 🎥 CAMERA COORDINATES (LOCKED)
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 7, 20], look: [-50, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // 🎨 TEXTURE LOADERS
  const travertineTexture = useLoader(THREE.TextureLoader, "/textures/travertine.jpg");
  travertineTexture.wrapS = travertineTexture.wrapT = THREE.RepeatWrapping;
  travertineTexture.repeat.set(2, 2);

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  // 🌅 Set Procedural Gradient Sky
  const skyTexture = useMemo(() => generateGradientSky(), []);
  scene.background = skyTexture;

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    
    // 🌊 Water ripple speed
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  // Reusable component for that grainy, architectural texture from reference
  const TexturedMaterial = () => (
    <meshStandardMaterial 
      color="#ede2df" 
      map={travertineTexture} 
      roughnessMap={travertineTexture}
      roughness={1.1} // Flat, organic feel
      metalness={0.05}
    />
  );

  return (
    <>
      <Environment preset="dawn" />
      <fog attach="fog" args={["#e8d2ca", 15, 95]} /> // Fog blending with sky pink
      
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.5} />

      {/* --- 🏠 STRUCTURE 1 (HOME VIEW) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <TexturedMaterial />
        </mesh>
        <mesh position={[0, 8, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 2.5, 32]} />
          <TexturedMaterial />
        </mesh>
      </group>

      {/* --- 🚪 STRUCTURE 2 (DOORWAY / COLLECTION VIEW) --- */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        
        {/* Curved Archway Frame (Replacing blocky pillars) */}
        <group position={[0, 15, 0]}>
          {/* Main vertical wall */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[16, 30, 4]} />
            <TexturedMaterial />
          </mesh>
          {/* The Actual Archway Cutout (Visual Hack) */}
          <mesh position={[0, -5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[6, 6, 5, 32, 1, false, 0, Math.PI]} />
            <meshBasicMaterial color="#dcd3d1" side={THREE.BackSide} /> // Matching background
          </mesh>
          {/* Tall, narrow doorway cutouts (similar to ref) */}
           <mesh position={[-6, -6, 0.1]}>
              <boxGeometry args={[1.5, 12, 5]} />
              <meshBasicMaterial color="#dcd3d1" />
           </mesh>
           <mesh position={[6, -6, 0.1]}>
              <boxGeometry args={[1.5, 12, 5]} />
              <meshBasicMaterial color="#dcd3d1" />
           </mesh>
        </group>

        {/* Floating Steps leading THROUGH the doorway */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 1.5, 8 - i * 4]} castShadow>
            <boxGeometry args={[8, 0.5, 6]} />
            <TexturedMaterial />
          </mesh>
        ))}

        {/* 🔮 RESTORED IRIDESCENT SPHERE (Nestled in water) */}
        <Float speed={1.5} floatIntensity={0.5} position={[-6, 0.5, 12]}>
          <mesh>
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
          <TexturedMaterial />
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
      
      <ContactShadows opacity={0.3} scale={200} blur={3} far={40} />
    </>
  );
}