import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* ULTRA-DENSE GRASS: Perfectly Synced and Lush */
const GrassyHills = ({ textureMap }) => {
  const meshRef = useRef();
  // Pushing density to 60k for that thick, carpeted "magazine" look
  const COUNT = 60000; 
  
  const getHillHeight = (x, y) => {
    const dist = Math.sqrt(x * x + y * y);
    const flatZone = 45;
    const smoothZone = 20;
    let influence = 1.0;
    if (dist < flatZone) influence = 0;
    else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;

    return (Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 + Math.sin(x * 0.08) * 3) * influence;
  };

  const hillGeom = useMemo(() => {
    // Increased segments for a smoother base surface
    const g = new THREE.PlaneGeometry(400, 400, 150, 150);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = getHillHeight(pos[i], pos[i + 1]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const dummy = new THREE.Object3D();
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      const y = getHillHeight(x, z);
      
      dummy.position.set(x, y, z);
      // More varied rotation for organic "clumping"
      dummy.rotation.set(
        Math.random() * 0.2, 
        Math.random() * Math.PI, 
        Math.random() * 0.2
      );
      
      // Scale variations to create "thick" and "thin" patches
      const s = 0.5 + Math.random() * 1.5;
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -40]}>
      <mesh geometry={hillGeom} receiveShadow>
        {/* Darker base color creates depth/shadow under the blades */}
        <meshStandardMaterial map={textureMap} color="#3a4d2a" roughness={1} />
      </mesh>
      
      <instancedMesh ref={meshRef} args={[null, null, COUNT]} castShadow>
        {/* Slightly wider geometry to make the field look "fuller" */}
        <coneGeometry args={[0.2, 2.2, 3]} /> 
        <meshStandardMaterial color="#7a925a" roughness={0.9} />
      </instancedMesh>
    </group>
  );
};

/* Component Logic for Scene */
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassHillsTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/reference_grass.png`);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const targetPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const exitPos = new THREE.Vector3(-8, 1.5, -100);

    camera.position.lerp(isHome ? targetPos : exitPos, LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-10, 2, -100]} turbidity={8} rayleigh={6} />
      <GrassyHills textureMap={grassHillsTex} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 450]} />

      {/* Clouds - Pinned High to avoid water contact */}
      <group>
        <Cloud position={[0, 95, -450]} speed={0.2} opacity={0.4} segments={60} bounds={[1000, 100, 50]} volume={150} color="#ffd1dc" />
        <Cloud position={[300, 80, -320]} speed={0.2} opacity={0.3} segments={50} bounds={[500, 60, 50]} volume={100} color="#fff9c4" />
      </group>

      {/* Main Architecture */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        {/* Stairs and Walls can be added here following your previous architecture layout */}
      </group>
      
      <ContactShadows position={[12, -1.9, 15]} opacity={0.15} scale={60} blur={4} far={12} />

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), { 
            waterNormals, 
            sunColor: 0xffffff, 
            waterColor: 0x224455, 
            alpha: 0.8,
            distortionScale: 0.4
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}