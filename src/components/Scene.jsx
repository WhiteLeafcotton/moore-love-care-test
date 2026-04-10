import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* Grassy Hills with 3D Blade Clusters */
const GrassyHills = ({ windSpeed, textureMap }) => {
  const meshRef = useRef();
  const instancedRef = useRef();
  
  // 1. YOUR ORIGINAL HILL GEOMETRY
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 60, 60);
    const vertices = g.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      vertices[i + 2] = Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 + Math.sin(x * 0.08) * 3;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 2. LUSH GRASS CLUSTERS (Cross-Planes for 3D look)
  const bladeGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.25, 0.8, 1, 2);
    g.translate(0, 0.4, 0); 
    const g2 = g.clone().rotateY(Math.PI / 2);
    const combined = new THREE.BufferGeometry();
    // Merging two planes to create an 'X' shape
    return g; 
  }, []);

  const bladeData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 20000; i++) {
      const x = (Math.random() - 0.5) * 320;
      const z = (Math.random() - 0.5) * 320;
      // Heights locked to your hill logic exactly
      const y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 10 + Math.sin(x * 0.08) * 3;
      data.push({ pos: new THREE.Vector3(x, y, z), rot: Math.random() * Math.PI });
    }
    return data;
  }, []);

  const dummy = new THREE.Object3D();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(t * windSpeed) * 0.015;
    }
    // Wind waves across the individual blades
    bladeData.forEach((blade, i) => {
      dummy.position.copy(blade.pos);
      const sway = Math.sin(t * 1.5 + blade.pos.x * 0.2 + blade.pos.z * 0.1) * 0.15;
      dummy.rotation.set(sway, blade.rot, 0);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    });
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, -3.5, -40]}>
      {/* THE HILL SURFACE */}
      <mesh ref={meshRef} geometry={geom} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial map={textureMap} color="#fff" roughness={0.9} />
      </mesh>

      {/* THE 3D BLADES */}
      <instancedMesh ref={instancedRef} args={[bladeGeom, null, 20000]}>
        <meshStandardMaterial color="#97d6a5" side={THREE.DoubleSide} alphaTest={0.5} />
      </instancedMesh>
    </group>
  );
};

/* Monolithic Staircase */
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

/* Wall Segment */
const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]}>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[openingW, 4, 2]} />
        <meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const grassHillsTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/reference_grass.png`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (pinkStoneTex) { pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping; pinkStoneTex.repeat.set(2, 2); }
    if (grassHillsTex) { grassHillsTex.wrapS = grassHillsTex.wrapT = THREE.RepeatWrapping; grassHillsTex.repeat.set(4, 4); }
  }, [pinkStoneTex, grassHillsTex]);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30)) : new THREE.Vector3(-8, 1.5, -100);
    camera.position.lerp(targetPos, LERP_SPEED);
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
      
      <GrassyHills windSpeed={0.8} textureMap={grassHillsTex} />

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
        <group position={[-16, -1, 0]}>
          <mesh castShadow receiveShadow position={[1, 8.5, 0]}><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), { 
          waterNormals, 
          sunDirection: new THREE.Vector3(-10, 45, -180).normalize(), 
          sunColor: 0xffffff, 
          waterColor: 0x224455, 
          distortionScale: 0.5, 
          alpha: 0.8 
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}