import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, ContactShadows, MeshDistortMaterial } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

function RealisticSky() {
  const skyTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#d2b4de"); // Top: Hazy Purple
    grad.addColorStop(0.6, "#f5eae8"); // Middle: Baby Pink
    grad.addColorStop(1, "#ebdcd8"); // Bottom: Horizon Glow
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 256);
    return new THREE.CanvasTexture(canvas);
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

  const views = {
    home: { pos: [18, 2, 18], look: [0, 2, 0] },
    collection: { pos: [-24, 8, 20], look: [-55, 5, -5] } 
  };

  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  // 🎨 TEXTURE LOADING (Ensure travertine.jpg is in /public/textures/)
  const stoneTex = useLoader(THREE.TextureLoader, "/textures/travertine.jpg");
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(4, 4);

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
      <fog attach="fog" args={["#f5eae8", 10, 100]} />
      
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffebd1" castShadow />
      <ambientLight intensity={0.4} />

      {/* --- 🏠 STRUCTURE 1 (HOME) --- */}
      <group position={[0, -2, -5]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[18, 25, 2]} />
          <meshStandardMaterial map={stoneTex} color="#f5eae8" roughness={1} />
        </mesh>
        <mesh position={[0, 8, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5, 5, 2.5, 32]} />
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
            <meshStandardMaterial map={stoneTex} color="#ffffff" roughness={1} />
          </mesh>
        ))}

        {/* 🔮 THE SPHERE (IN WATER) */}
        <Float speed={2} floatIntensity={1} position={[-8, 1, 14]}>
          <mesh castShadow>
            <sphereGeometry args={[3.5, 64, 64]} />
            <MeshDistortMaterial 
              color="#ffffff" speed={3} distort={0.3} transmission={1} 
              thickness={1} roughness={0.01} iridescence={1}
            />
          </mesh>
        </Float>
      </group>

      {/* 🌊 WATER SURFACE */}
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