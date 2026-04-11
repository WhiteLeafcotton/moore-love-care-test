import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* SOLARIUM SANCTUARY: WILD LEAFY OVERGROWTH
   Uses a custom clump geometry to mimic the dense, leafy texture
   of the reference image.
*/
const GrassyHills = ({ leafTexture }) => {
  const meshRef = useRef();
  // High density is key for the "carpet" feel
  const COUNT = 85000; 
  
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
    const g = new THREE.PlaneGeometry(500, 500, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const dummy = new THREE.Object3D();
  
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      const y = getHillHeight(x, z);
      
      dummy.position.set(x, y, z);
      // Random rotation ensures the leafy planes don't look repetitive
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      
      // Scaling creates the variation between "moss" and "ferns"
      const s = 0.4 + Math.random() * 1.8;
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={[0, -4, -40]}>
      {/* Dark ground layer for visual weight */}
      <mesh geometry={hillGeom}>
        <meshStandardMaterial color="#050a01" roughness={1} />
      </mesh>
      
      {/* The Leafy Instances */}
      <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial 
          map={leafTexture}
          alphaTest={0.5} 
          transparent
          side={THREE.DoubleSide}
          // The specific vibrant green from your reference
          color="#a4cc3d" 
          emissive="#2d3d05" 
          emissiveIntensity={0.5}
          roughness={0.6}
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

  // Use a leafy/clump texture instead of a blade texture
  const leafClumpTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg");
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
      <Sky sunPosition={[-10, 5, -100]} turbidity={8} rayleigh={2} />
      
      <GrassyHills leafTexture={leafClumpTex} />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 20, 400]} />

      <hemisphereLight intensity={1.8} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.6} castShadow />

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
            waterColor: 0x012b16,
            distortionScale: 3.7,
            alpha: 0.9,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}