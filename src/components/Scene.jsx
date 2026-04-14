import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 80000; 
const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / 25, 1.0);
  const hills = [
    { x: 20, z: -100, h: 18, w: 16 },      
    { x: -70, z: -50, h: 12, w: 12 },      
    { x: 55, z: -40, h: 14, w: 14 }       
  ];
  let hillHeight = 0;
  hills.forEach(h => {
    const d = Math.sqrt(Math.pow(x - h.x, 2) + Math.pow(z - h.z, 2));
    hillHeight += Math.exp(-Math.pow(d / h.w, 2)) * h.h;
  });
  return hillHeight * influence;
};

// --- THE FLOATING PLATFORM (FIXED NESTING) ---
const FloatingPlatform = ({ butterProps }) => {
  return (
    <Float 
      speed={1.5} 
      rotationIntensity={0.2} 
      floatIntensity={0.5} 
      position={[12, -0.6, 18]} // The floating logic happens to this whole group
    >
      <group>
        {/* THE MAIN BASE MESH */}
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[3.5, 3.5, 0.2, 64]} /> 
          <meshStandardMaterial 
            color="#ffffff" 
            transparent={true} 
            opacity={0.9} 
            roughness={0.1}
          />
        </mesh>

        {/* RUG */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
            <circleGeometry args={[2.8, 64]} />
            <meshStandardMaterial color="#2a1d38" />
        </mesh>

        {/* CHAIR */}
        <group position={[-0.8, 0.1, 0]} rotation={[0, 0.5, 0]}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[1.4, 0.2, 1.4]} />
                <meshStandardMaterial color="#3b2a4d" />
            </mesh>
            <mesh position={[0, 1.1, -0.65]} rotation={[-0.1, 0, 0]} castShadow>
                <boxGeometry args={[1.4, 1.4, 0.2]} />
                <meshStandardMaterial color="#3b2a4d" />
            </mesh>
        </group>

        {/* LAMP */}
        <group position={[1.6, 0.1, -1.0]}>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 3]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-0.7, 3, 0]}>
              <boxGeometry args={[1.4, 0.05, 0.05]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-1.4, 2.6, 0]}>
                <sphereGeometry args={[0.15, 32, 32]} />
                <meshStandardMaterial emissive="#ffdca8" emissiveIntensity={6} color="#fff4cc" />
            </mesh>
            <pointLight position={[-1.4, 2.6, 0]} intensity={2.5} distance={10} color="#ffdca8" />
        </group>

        {/* CHARACTERS ON PLATFORM */}
        <group position={[-0.8, 0.45, 0]}>
             <BlockHumanoid scale={0.8} materialProps={butterProps} poseProps={{ leftLegRotation: [Math.PI/2, 0, 0], rightLegRotation: [Math.PI/2, 0, 0], headRotationY: 0.4 }} />
        </group>
        <group position={[1.2, 0.1, 1.0]} rotation={[0, -0.6, 0]}>
             <BlockHumanoid isHelper scale={0.9} materialProps={butterProps} poseProps={{ isLeaning: true, headRotationY: -0.3 }} />
        </group>
      </group>
    </Float>
  );
};

// --- HUMANOID COMPONENT ---
const BlockHumanoid = forwardRef(({ scale = 1, materialProps, poseProps = {}, isHelper = false }, ref) => {
  const { 
    leftLegRotation = [0, 0, 0], 
    rightLegRotation = [0, 0, 0], 
    isLeaning = false,
    headRotationY = 0 
  } = poseProps;
  
  const torsoRef = useRef();
  const headRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (torsoRef.current && isLeaning) {
        torsoRef.current.rotation.z = Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <group scale={scale}>
      <group ref={torsoRef}>
        <mesh ref={headRef} position={[0, 1.4, 0]} castShadow><sphereGeometry args={[0.22, 32, 32]} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[0.36, 1.0, 0.2]} /><meshStandardMaterial {...materialProps} /></mesh>
        <group position={[0, 0.4, 0]}>
          <mesh position={[-0.12, -0.4, 0]} rotation={leftLegRotation} castShadow><boxGeometry args={[0.12, 0.8, 0.12]} /><meshStandardMaterial {...materialProps} /></mesh>
          <mesh position={[0.12, -0.4, 0]} rotation={rightLegRotation} castShadow><boxGeometry args={[0.12, 0.8, 0.12]} /><meshStandardMaterial {...materialProps} /></mesh>
        </group>
      </group>
    </group>
  );
});

// --- GRASS ---
const GrassySassyHills = () => {
  const meshRef = useRef();
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.05, 1.2, 1, 4);
    g.translate(0, 0.6, 0);
    return g;
  }, []);
  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) { pos[i + 1] = getHillHeight(pos[i], pos[i + 2]); }
    g.computeVertexNormals(); return g;
  }, []);

  useFrame((state) => {
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 400; const z = (Math.random() - 0.5) * 400; const y = getHillHeight(x, z);
        if (y > 0.05) { dummy.position.set(x, y - 0.05, z); dummy.updateMatrix(); meshRef.current.setMatrixAt(i, dummy.matrix); }
        else { dummy.scale.setScalar(0); dummy.updateMatrix(); meshRef.current.setMatrixAt(i, dummy.matrix); }
      }
      meshRef.current.instanceMatrix.needsUpdate = true; meshRef.current._init = true;
    }
  });

  return (
    <group position={[0, -3.5, -40]}>
      <mesh geometry={terrainGeo} receiveShadow><meshStandardMaterial color="#0c020f" roughness={1} /></mesh>
      <instancedMesh ref={meshRef} args={[bladeGeo, null, GRASS_COUNT]} castShadow>
        <meshStandardMaterial color="#c292f5" />
      </instancedMesh>
    </group>
  );
};

// --- ARCHITECTURE ---
const Staircase = ({ position, width, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    {Array.from({ length: 16 }).map((_, i) => (
      <group key={i} position={[0, -i * 0.5, i * 0.8]}>
        <mesh castShadow receiveShadow><boxGeometry args={[width, 0.5, 0.8]} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0, -2.5, 0]} castShadow receiveShadow><boxGeometry args={[width, 5, 0.8]} /><meshStandardMaterial {...materialProps} /></mesh>
      </group>
    ))}
  </group>
);

// --- MAIN SCENE ---
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  useEffect(() => { if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-18, 5, 42) : new THREE.Vector3(-14, 4.5, 34)) : new THREE.Vector3(-24.5, 3.5, -450);
    const targetLook = isHome ? new THREE.Vector3(8, 1.5, 10) : new THREE.Vector3(-24.5, 1.5, -1000);
    
    camera.position.lerp(targetPos, 0.05); 
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
  });

  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <GrassySassyHills />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow />

      <group>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow><boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} /></mesh>
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />
        <mesh position={[2, 6.5, 0]} castShadow receiveShadow><boxGeometry args={[40, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
      </group>

      <water 
        ref={waterRef} 
        args={[
          new THREE.PlaneGeometry(2000, 2000), 
          { 
            waterNormals, 
            sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), 
            sunColor: 0xffffff, 
            waterColor: TITLE_PURPLE, 
            distortionScale: 1.0, 
            alpha: 0.95 
          }
        ]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.45, 0]} 
      />

      <FloatingPlatform butterProps={butterProps} />
    </>
  );
}