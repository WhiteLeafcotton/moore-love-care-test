import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* SOLARIUM SANCTUARY GRASS SYSTEM 
  Redesigned to wrap perfectly over hills and provide high-density coverage.
*/
const GrassyHills = ({ textureMap }) => {
  const meshRef = useRef();
  // Extreme density for the magazine-style "thick" look
  const COUNT = 100000; 
  
  // SHARED HEIGHT LOGIC
  const getHillHeight = (x, z) => {
    const dist = Math.sqrt(x * x + z * z);
    const flatZone = 40;
    const smoothZone = 30;
    let influence = 1.0;
    
    if (dist < flatZone) influence = 0;
    else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;

    // Rolling hill wave math
    return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
  };

  const hillGeom = useMemo(() => {
    // High-poly plane for smooth hills
    const g = new THREE.PlaneGeometry(500, 500, 150, 150);
    // Rotate the geometry itself so its 'up' matches world 'up' (Y)
    g.rotateX(-Math.PI / 2);
    
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      // Apply height to the Y axis (index i + 1)
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const dummy = new THREE.Object3D();
  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < COUNT; i++) {
      // Randomly scatter over the 500x500 plane
      const x = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      const y = getHillHeight(x, z);
      
      // Pin blade to surface
      dummy.position.set(x, y, z);
      
      // Organic rotation: Random spin + slight tilt to follow the hill curve
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.3, 
        Math.random() * Math.PI, 
        (Math.random() - 0.5) * 0.3
      );
      
      // Varied scale for natural "overgrown" texture
      const s = 0.4 + Math.random() * 1.6;
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={[0, -4, -40]}>
      {/* Hill Base */}
      <mesh geometry={hillGeom} receiveShadow>
        <meshStandardMaterial 
          map={textureMap} 
          color="#2d3d1d" 
          roughness={1} 
          metalness={0}
        />
      </mesh>
      
      {/* High-Density Grass Instances */}
      <instancedMesh ref={meshRef} args={[null, null, COUNT]} castShadow>
        {/* Wider cone creates a "clumpier" feel than a thin needle */}
        <coneGeometry args={[0.25, 2.5, 3]} /> 
        <meshStandardMaterial 
          color="#6b8e23" 
          roughness={0.9} 
          emissive="#2d3d1d" 
          emissiveIntensity={0.2}
        />
      </instancedMesh>
    </group>
  );
};

/* MAIN SCENE COMPONENT */
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  // Assets
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

    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.15;
    }
  });

  return (
    <>
      <Sky 
        distance={450000} 
        sunPosition={[-10, 5, -100]} 
        turbidity={10} 
        rayleigh={3} 
      />
      
      <GrassyHills textureMap={grassHillsTex} />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 400]} />

      {/* Atmospheric Lighting */}
      <hemisphereLight intensity={1.2} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.2} castShadow />

      {/* Architecture Shell (The Pink Sanctuary) */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        {/* Placeholder for remaining walls/stairs from your original code */}
      </group>

      <ContactShadows position={[12, -1.9, 15]} opacity={0.2} scale={60} blur={3} far={10} />

      {/* Water System */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(5000, 5000),
          {
            textureWidth: 1024,
            textureHeight: 1024,
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