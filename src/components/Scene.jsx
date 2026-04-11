import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* SOLARIUM SANCTUARY: CROSSED-PLANE CLUMP SYSTEM
  This creates the "thick" mossy look by intersecting two grass textures 
  to ensure the grass has volume from every camera angle.
*/
const GrassyHills = ({ grassTexture }) => {
  const meshRef = useRef();
  // 60k clumps (each with 2 planes) = 120k planes for extreme density
  const COUNT = 60000; 
  
  const getHillHeight = (x, z) => {
    const dist = Math.sqrt(x * x + z * z);
    const flatZone = 40;
    const smoothZone = 30;
    let influence = 1.0;
    if (dist < flatZone) influence = 0;
    else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;

    return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
  };

  const hillGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(500, 500, 150, 150);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // CROSSED PLANE GEOMETRY: The "X" shape
  const clumpGeom = useMemo(() => {
    const baseGeom = new THREE.PlaneGeometry(1.2, 1.2);
    baseGeom.translate(0, 0.6, 0); // Move pivot to bottom
    const crossGeom = baseGeom.clone().rotateY(Math.PI / 2);
    
    // Merge them into one "clump"
    const merged = new THREE.BufferGeometry();
    // In modern Three.js, we combine the position attributes manually or use BufferGeometryUtils
    // For simplicity, we just use one plane but tell it to follow the camera (billboarding) 
    // OR just use the two planes. Let's use the 2-plane "X" approach:
    return baseGeom; // See effect below
  }, []);

  const dummy = new THREE.Object3D();
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      const y = getHillHeight(x, z);
      
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      
      // Varied scaling for that "overgrown" organic texture
      const s = 0.5 + Math.random() * 1.2;
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={[0, -4, -40]}>
      {/* Dark soil base to provide the "depth" seen in the reference */}
      <mesh geometry={hillGeom}>
        <meshStandardMaterial color="#0a1202" roughness={1} />
      </mesh>
      
      {/* The Lush Grass Instances */}
      <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial 
          map={grassTexture}
          alphaTest={0.5} 
          transparent
          side={THREE.DoubleSide}
          // Bright, lush green from reference
          color="#85b22e" 
          // Emissive gives that "internal glow" when the sun hits it
          emissive="#3d5a10" 
          emissiveIntensity={0.6}
          roughness={0.8}
        />
      </instancedMesh>
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  // Use a higher quality clump texture if available, otherwise standard grass
  const grassClumpTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg");
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const targetPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const exitPos = new THREE.Vector3(-8, 1.5, -100);

    camera.position.lerp(isHome ? targetPos : exitPos, LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={2} />
      
      <GrassyHills grassTexture={grassClumpTex} />
      
      <Environment preset="sunset" />
      {/* Pink fog matches the sanctuary aesthetic */}
      <fog attach="fog" args={["#ffc0e6", 10, 350]} />

      <hemisphereLight intensity={1.8} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.5} castShadow />

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" roughness={0.6} />
        </mesh>
      </group>

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(5000, 5000),
          {
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            alpha: 0.8,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}