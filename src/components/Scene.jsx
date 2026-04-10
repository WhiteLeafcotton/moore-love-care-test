import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* 1. GRASSY HILLS (Hills + 3D Blades) */
const GrassyHills = ({ windSpeed = 1.2, textureMap }) => {
  const meshRef = useRef();
  const hillRef = useRef();

  // The Hill Geometry (from your reference)
  const hillGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(350, 350, 60, 60);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const y = pos[i + 1];
      pos[i + 2] = Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 + Math.sin(x * 0.08) * 3;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // The 3D Blade Setup
  const bladeGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.12, 0.7, 1, 3);
    g.translate(0, 0.35, 0); 
    return g;
  }, []);

  const bladeData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 40000; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      const y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 10 + Math.sin(x * 0.08) * 3;
      data.push({ pos: new THREE.Vector3(x, y, z), rot: Math.random() * Math.PI });
    }
    return data;
  }, []);

  const dummy = new THREE.Object3D();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    bladeData.forEach((blade, i) => {
      dummy.position.copy(blade.pos);
      // Realistic individual sway
      const sway = Math.sin(t * windSpeed + blade.pos.x * 0.3 + blade.pos.z * 0.2) * 0.2;
      dummy.rotation.set(sway, blade.rot, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, -3.5, -40]}>
      {/* THE HILL SURFACE (Uses your reference grass texture) */}
      <mesh geometry={hillGeom} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial 
          map={textureMap} 
          color={textureMap ? "#fff" : "#ffc2e2"} 
          roughness={0.9} 
        />
      </mesh>

      {/* THE 3D BLADES (Growing out of the hill) */}
      <instancedMesh ref={meshRef} args={[bladeGeom, null, 40000]} castShadow>
        <meshStandardMaterial color="#fcaed5" side={THREE.DoubleSide} alphaTest={0.5} />
      </instancedMesh>
    </group>
  );
};

/* 2. STAIRCASE */
const Staircase = ({ position, width, texture, rotation }) => {
  const stepHeight = 0.5;
  const stepDepth = 0.8;
  const numSteps = 16;
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <group key={i} position={[0, -i * stepHeight, i * stepDepth]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, stepHeight, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* 3. MAIN SCENE */
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const cloudGroupRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  
  // YOUR TEXTURE LOADING LOGIC
  const grassHillsTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/reference_grass.png`, 
    (loader) => { loader.onError = (err) => console.error("Grass texture 404:", err); }
  );

  useMemo(() => {
    if (pinkStoneTex) { pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping; pinkStoneTex.repeat.set(2, 2); }
    if (grassHillsTex) {
      grassHillsTex.wrapS = grassHillsTex.wrapT = THREE.RepeatWrapping;
      grassHillsTex.repeat.set(8, 8);
      grassHillsTex.anisotropy = 16;
    }
  }, [pinkStoneTex, grassHillsTex]);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const sweetSpotPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    camera.position.lerp(isHome ? sweetSpotPos : new THREE.Vector3(-8, 1.5, -100), LERP_SPEED);
    lookAtTarget.current.lerp(isHome ? new THREE.Vector3(12, 1.5, 0) : new THREE.Vector3(-8, 1.5, -200), LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
    if (cloudGroupRef.current) {
        cloudGroupRef.current.position.x += delta * 1.8;
        if (cloudGroupRef.current.position.x > 180) cloudGroupRef.current.position.x = -180;
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 6, -100]} inclination={0.49} azimuth={0.25} turbidity={12} rayleigh={0.3} />
      
      {/* THE BLADES OF BLOWING GRASS + HILLS */}
      <GrassyHills windSpeed={1.4} textureMap={grassHillsTex} />

      <mesh position={[-10, 45, -180]}>
        <sphereGeometry args={[isMobile ? 18 : 22, 64, 64]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffba5c" emissiveIntensity={4} transparent opacity={0.7} />
        <pointLight intensity={5} distance={400} color="#fff1d4" />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 320]} />

      <group ref={cloudGroupRef}>
        <Cloud position={[-10, 45, -165]} speed={0.5} opacity={0.7} segments={30} bounds={[50, 20, 10]} volume={20} color="#ffd1dc" />
        <Cloud position={[30, 55, -175]} speed={0.4} opacity={0.6} segments={25} bounds={[40, 15, 5]} volume={15} color="#e6e6fa" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunDirection: new THREE.Vector3(-10, 45, -180).normalize(), sunColor: 0xffffff, waterColor: 0x224455, distortionScale: 0.5, alpha: 0.8 }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}