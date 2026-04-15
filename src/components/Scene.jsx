import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000;
const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 

// --- CONSISTENT COMFY RECLINER ---
const ComfyChair = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation} scale={0.7}>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[1.6, 0.7, 1.4]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} transparent={false} depthWrite={true} />
    </mesh>
    <mesh position={[0, 1.0, -0.4]} rotation={[-0.2, 0, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[1.6, 1.4, 0.6]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} transparent={false} depthWrite={true} />
    </mesh>
    <mesh position={[-0.9, 0.7, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[0.4, 0.8, 1.3]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} transparent={false} depthWrite={true} />
    </mesh>
    <mesh position={[0.9, 0.7, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[0.4, 0.8, 1.3]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} transparent={false} depthWrite={true} />
    </mesh>
  </group>
);

// --- CONSISTENT ARC LAMP ---
const ArcLamp = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.05, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
      <meshStandardMaterial {...materialProps} color="#444" depthTest={false} transparent={false} />
    </mesh>
    <mesh position={[0, 2.5, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
      <meshStandardMaterial {...materialProps} color="#222" depthTest={false} transparent={false} />
    </mesh>
    <mesh position={[1.2, 5.0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={10001}>
      <cylinderGeometry args={[0.05, 0.05, 2.4, 16]} />
      <meshStandardMaterial {...materialProps} color="#222" depthTest={false} transparent={false} />
    </mesh>
    <mesh position={[2.4, 4.7, 0]} renderOrder={10002}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} depthTest={false} />
    </mesh>
  </group>
);

// --- ARCHITECTURE COMPONENTS ---
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

const WallOpening = ({ position, colorProps, width = 6, openingW = 4.8, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    <mesh position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]} castShadow receiveShadow><boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    {isWindow && <mesh position={[0, 2, 0]} castShadow receiveShadow><boxGeometry args={[openingW, 4, 2]} /><meshStandardMaterial {...colorProps} /></mesh>}
  </group>
);

// --- FLOATING PLATFORM ---
const FloatingPlatform = ({ butterProps }) => {
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4} position={[12, -0.8, 18]}>
      <mesh renderOrder={10000} frustumCulled={false}>
        <cylinderGeometry args={[4.2, 4.2, 0.3, 64]} /> 
        <meshStandardMaterial color="#ffffff" depthTest={false} transparent={true} opacity={0.95} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10001}>
        <circleGeometry args={[2.5, 64]} />
        <meshStandardMaterial color="#e8d5e0" depthTest={false} transparent={false} />
      </mesh>
      <ComfyChair position={[-0.8, 0.2, 0]} rotation={[0, Math.PI / 4, 0]} materialProps={butterProps} />
      <ArcLamp position={[-2.2, 0.2, -1.5]} rotation={[0, Math.PI / 4, 0]} materialProps={butterProps} />
      <group position={[-0.8, 0.7, 0]} rotation={[0, Math.PI / 4, 0]}>
         <BlockHumanoid scale={0.8} materialProps={{...butterProps, depthTest: false}} poseProps={{ leftLegRotation: [1.4, 0, 0], rightLegRotation: [1.4, 0, 0], torsoRotationX: 0.1 }} />
      </group>
      <group position={[1.2, 0.2, 1.0]} rotation={[0, -Math.PI / 1.5, 0]}>
         <BlockHumanoid isHelper scale={0.9} materialProps={{...butterProps, depthTest: false}} poseProps={{ headRotationY: -0.4, rightArmRotation: [1.1, 0, -0.3] }} />
      </group>
    </Float>
  );
};

// --- HUMANOID SYSTEM ---
const BlockHumanoid = forwardRef(({ scale = 1, materialProps, poseProps = {}, isHelper = false }, ref) => {
  const { leftLegRotation = [0, 0, 0], rightLegRotation = [0, 0, 0], leftArmRotation = [0.2, 0, -0.1], rightArmRotation = [0.2, 0, 0.1], position = [0,0,0], rotation = [0,0,0], headRotationY = 0 } = poseProps;
  const torsoRef = useRef(); const leftLegRef = useRef(); const rightLegRef = useRef();
  const leftArmRef = useRef(); const rightArmRef = useRef(); const headRef = useRef(); const innerGroupRef = useRef();
  
  const limbGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.08, 0.05), new THREE.Vector2(0.08, 0.75), new THREE.Vector2(0, 0.8)];
    const g = new THREE.LatheGeometry(pts, 32); g.translate(0, -0.8, 0); return g;
  }, []);

  const torsoGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.18, 0.1), new THREE.Vector2(0.18, 0.9), new THREE.Vector2(0, 1.0)];
    return new THREE.LatheGeometry(pts, 32);
  }, []);

  useFrame(() => {
    if (torsoRef.current) torsoRef.current.rotation.x = poseProps.torsoRotationX || 0;
    if (headRef.current) headRef.current.rotation.y = headRotationY;
    if (leftLegRef.current) leftLegRef.current.rotation.set(...leftLegRotation);
    if (rightLegRef.current) rightLegRef.current.rotation.set(...rightLegRotation);
    if (leftArmRef.current) leftArmRef.current.rotation.set(...leftArmRotation);
    if (rightArmRef.current) rightArmRef.current.rotation.set(...rightArmRotation);
  });

  return (
    <group scale={scale} position={position} rotation={rotation} ref={innerGroupRef}>
      <group ref={torsoRef}>
        <mesh ref={headRef} position={[0, 1.4, 0]} renderOrder={10002}><sphereGeometry args={[0.22, 32, 32]} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0, 0.3, 0]} renderOrder={10002}><primitive object={torsoGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        <group position={[0, 1.2, 0]}>
          <group ref={leftArmRef} position={[-0.22, 0, 0]}><mesh renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
          <group ref={rightArmRef} position={[0.22, 0, 0]}><mesh renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
        </group>
      </group>
      <group position={[0, 0.4, 0]}>
        <group ref={leftLegRef} position={[-0.12, 0, 0]}><mesh renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
        <group ref={rightLegRef} position={[0.12, 0, 0]}><mesh renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
      </group>
    </group>
  );
});

// --- MAIN SCENE ---
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;
  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  useEffect(() => { if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28)) : new THREE.Vector3(-24.5, 3.5, -450);
    const targetLook = isHome ? new THREE.Vector3(20, 1.2, -2) : new THREE.Vector3(-24.5, 1.5, -1000);
    camera.position.lerp(targetPos, 0.05); camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow />

      {/* RE-ADDED MAIN STRUCTURE */}
      <group position={[0, 0, 0]}>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow><boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} /></mesh>
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />
        <group position={[-16, -1.6, 0]}>
          <WallOpening position={[6, 0, 0]} colorProps={butterProps} /> 
          <WallOpening position={[12, 0, 0]} colorProps={butterProps} /> 
        </group>
      </group>

      {/* FLOATING PLATFORM SCENE */}
      <FloatingPlatform butterProps={butterProps} />

      <water 
        ref={waterRef} 
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), sunColor: 0xffffff, waterColor: TITLE_PURPLE, distortionScale: 1.0, alpha: 0.95 }]} 
        rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]} 
      />
    </>
  );
}