import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera, scene } = useThree();
  const waterRef = useRef();

  // 🎥 CAMERA COORDINATES
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 7, 20], look: [-55, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // 🎨 TEXTURE LOADING (Ensure travertine.jpg is in /public/textures/)
  const travertine = useLoader(THREE.TextureLoader, "/textures/travertine.jpg");
  travertine.wrapS = travertine.wrapT = THREE.RepeatWrapping;
  travertine.repeat.set(1, 1);

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  // 🌅 FIXED: Gradient Sky Setup
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#c39bd3"); // Top: Purple
    grad.addColorStop(1, "#e8d2ca"); // Bottom: Pink Horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 256);
    const tex = new THREE.CanvasTexture(canvas);
    scene.background = tex;
  }, [scene]);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Environment preset="dawn" />
      <fog attach="fog" args={["#e8d2ca", 20, 100]} />
      <spotLight position={[30, 20, 10]} intensity={1.5} castShadow color="#ffebd1" />
      <ambientLight intensity={0.5} />

      {/* --- 🏠 STRUCTURE 1 (HOME) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <meshStandardMaterial map={travertine} color="#ede2df" roughness={1} />
        </mesh>
        <mesh position={[0, 8, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 2.5, 32]} />
          <meshStandardMaterial map={travertine} color="#dcd3d1" />
        </mesh>
      </group>

      {/* --- 🚪 STRUCTURE 2 (DOORWAY) --- */}
      <group position={[-55, -2, -8]} rotation={[0, Math.PI / 8, 0]}>
        
        {/* Main Arch Wall */}
        <mesh position={[0, 12, 0]} castShadow>
          <boxGeometry args={[20, 30, 4]} />
          <meshStandardMaterial map={travertine} color="#ede2df" roughness={1} />
        </mesh>

        {/* The Arch Cutout Effect */}
        <mesh position={[0, 6, 2.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[6, 6, 0.5, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#f2e9e4" />
        </mesh>

        {/* Floating Steps */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 1.5, 10 - i * 4]} castShadow>
            <boxGeometry args={[8, 0.5, 6]} />
            <meshStandardMaterial map={travertine} color="#ffffff" />
          </mesh>
        ))}

        {/* 🔮 THE SPHERE (IN WATER) */}
        <Float speed={1.5} floatIntensity={0.5} position={[-8, 1, 14]}>
          <mesh castShadow>
            <sphereGeometry args={[3.5, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" speed={2} distort={0.2} transmission={1} 
              thickness={2} roughness={0.02} iridescence={1.5}
            />
          </mesh>
        </Float>
      </group>

      {/* 🌊 GLOBAL WATER */}
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