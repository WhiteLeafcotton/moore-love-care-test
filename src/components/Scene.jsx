import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// Hill height logic - properly isolated
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = 1.0;
  if (dist < flatZone) influence = 0;
  else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const SanctuaryHills = () => {
  const meshRef = useRef();
  
  // Use a grass/rock texture to give the hills organic detail
  const texture = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);

  const geometry = useMemo(() => {
    // High segments (256) make the hills look smooth and high-end
    const g = new THREE.PlaneGeometry(650, 650, 256, 256);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -4, -40]} receiveShadow>
      <meshStandardMaterial 
        map={texture}
        color="#3a5a2a" // Deep, realistic green
        roughness={0.9} 
        metalness={0.0}
        flatShading={false}
      />
    </mesh>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = new THREE.Vector3(-15, 1.5, 30);
    const exitPos = new THREE.Vector3(-8, 1.5, -100);
    camera.position.lerp(isHome ? targetPos : exitPos, 0.04);
    camera.lookAt(lookAtTarget.current);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      
      <SanctuaryHills />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 600]} />
      <hemisphereLight intensity={2.0} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={1.5} castShadow />

      <mesh position={[12, -2.0, 15]} castShadow>
        <boxGeometry args={[14, 8.0, 28]} />
        <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
      </mesh>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          waterNormals,
          sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          distortionScale: 3.7,
          alpha: 0.8,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}