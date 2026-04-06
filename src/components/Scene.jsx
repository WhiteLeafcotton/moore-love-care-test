import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// 🌅 Stable Realistic Sky Component
function RealisticSky() {
  const skyTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#d2b4de"); // Hazy Purple Top
    grad.addColorStop(0.7, "#f5eae8"); // Baby Pink Horizon
    grad.addColorStop(1, "#ebdcd8"); 
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 256);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <mesh scale={1000}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial map={skyTex} side={THREE.BackSide} fog={false} />
    </mesh>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  // 🎥 Locked Camera Paths
  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 8, 20], look: [-55, 5, -5] } 
  };
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // 🎨 Texture Loading with Error Catching
  // Ensure your file is at: /public/textures/travertine.jpg
  const stoneTex = useLoader(THREE.TextureLoader, "/textures/travertine.jpg");
  if (stoneTex) {
    stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(4, 4);
  }

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.04); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.04);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <RealisticSky />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f5eae8", 10, 110]} />
      
      <directionalLight position={[10, 15, 5]} intensity={1} color="#ffebd1" />
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
          <mesh>
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
        args={[new THREE.PlaneGeometry(2000, 2000), {
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