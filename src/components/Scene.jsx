import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 

// --- FURNITURE COMPONENTS ---

const LStyleLamp = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.05, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
      <meshBasicMaterial color="#21162e" depthTest={false} transparent opacity={0.9} />
    </mesh>
    <mesh position={[0, 2, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.04, 0.04, 4, 16]} />
      <meshBasicMaterial color="#21162e" depthTest={false} transparent opacity={0.9} />
    </mesh>
    <mesh position={[-0.75, 4, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={10001}>
      <cylinderGeometry args={[0.03, 0.03, 1.5, 16]} />
      <meshBasicMaterial color="#21162e" depthTest={false} transparent opacity={0.9} />
    </mesh>
    <mesh position={[-1.5, 3.7, 0]} renderOrder={10002}>
      <sphereGeometry args={[0.25, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} rotation={[Math.PI, 0, 0]} />
      <meshBasicMaterial color="#ffffff" depthTest={false} transparent opacity={1} />
    </mesh>
  </group>
);

const LazyBoyChair = ({ position, rotation }) => (
  <group position={position} rotation={rotation} scale={0.7}>
    <mesh position={[0, 0.4, 0]} renderOrder={10001}>
      <boxGeometry args={[1.5, 0.8, 1.5]} />
      <meshBasicMaterial color={DARKER_PINK_THEME} depthTest={false} transparent opacity={0.95} />
    </mesh>
    <mesh position={[0, 1.2, -0.6]} rotation={[-0.3, 0, 0]} renderOrder={10001}>
      <boxGeometry args={[1.5, 1.6, 0.4]} />
      <meshBasicMaterial color={DARKER_PINK_THEME} depthTest={false} transparent opacity={0.95} />
    </mesh>
    {[-0.85, 0.85].map((x, i) => (
      <mesh key={i} position={[x, 0.7, 0]} renderOrder={10001}>
        <boxGeometry args={[0.3, 0.6, 1.5]} />
        <meshBasicMaterial color={DARKER_PINK_THEME} depthTest={false} transparent opacity={0.95} />
      </mesh>
    ))}
  </group>
);

const FloatingPlatform = () => {
  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.5} position={[11, -1.0, 17]}>
      {/* Platform Disk */}
      <mesh renderOrder={10000}>
        <cylinderGeometry args={[4.2, 4.2, 0.25, 64]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} transparent opacity={0.8} />
      </mesh>

      {/* Circle Rug under Chair */}
      <mesh position={[-0.8, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10001}>
        <circleGeometry args={[2.2, 64]} />
        <meshBasicMaterial color={TITLE_PURPLE} depthTest={false} transparent opacity={0.3} />
      </mesh>

      {/* The Recliner */}
      <LazyBoyChair position={[-0.8, 0.15, 0]} rotation={[0, Math.PI / 4, 0]} />

      {/* The L-Lamp */}
      <LStyleLamp position={[-2.2, 0.15, -1.5]} />

      {/* Seated Resident (Bob) */}
      <group position={[-0.8, 0.62, 0]} rotation={[0, Math.PI / 4, 0]}>
        <BlockHumanoid 
          scale={0.8} 
          materialProps={{...butterProps, depthTest: false}} 
          poseProps={{ 
            leftLegRotation: [1.5, 0, 0], 
            rightLegRotation: [1.5, 0, 0], 
            torsoRotationX: 0.05 
          }} 
        />
      </group>

      {/* Standing Helper */}
      <group position={[1.4, 0.13, 1.1]} rotation={[0, -Math.PI / 1.5, 0]}>
        <BlockHumanoid 
          isHelper 
          scale={0.92} 
          materialProps={{...butterProps, depthTest: false}} 
          poseProps={{ 
            headRotationY: -0.4, 
            rightArmRotation: [1.1, 0, -0.3] 
          }} 
        />
      </group>
    </Float>
  );
};

// --- HUMANOID SYSTEM ---
const BlockHumanoid = forwardRef(({ scale = 1, materialProps, poseProps = {}, isHelper = false }, ref) => {
  const { 
    leftLegRotation = [0, 0, 0], 
    rightLegRotation = [0, 0, 0], 
    leftArmRotation = [0.2, 0, -0.1], 
    rightArmRotation = [0.2, 0, 0.1], 
    position = [0,0,0], 
    rotation = [0,0,0], 
    headRotationY = 0,
    torsoRotationX = 0
  } = poseProps;
  
  const torsoRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const headRef = useRef();

  useImperativeHandle(ref, () => ({
    leftLeg: leftLegRef.current,
    rightLeg: rightLegRef.current,
    leftArm: leftArmRef.current,
    rightArm: rightArmRef.current,
    head: headRef.current,
    torso: torsoRef.current
  }));

  const limbGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.08, 0.05), new THREE.Vector2(0.08, 0.75), new THREE.Vector2(0, 0.8)];
    const g = new THREE.LatheGeometry(pts, 32);
    g.translate(0, -0.8, 0); 
    return g;
  }, []);

  const torsoGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.18, 0.1), new THREE.Vector2(0.18, 0.9), new THREE.Vector2(0, 1.0)];
    return new THREE.LatheGeometry(pts, 32);
  }, []);

  useFrame(() => {
    if (torsoRef.current) torsoRef.current.rotation.x = torsoRotationX;
    if (headRef.current) headRef.current.rotation.y = headRotationY;
    if (leftLegRef.current) leftLegRef.current.rotation.set(...leftLegRotation);
    if (rightLegRef.current) rightLegRef.current.rotation.set(...rightLegRotation);
    if (leftArmRef.current) leftArmRef.current.rotation.set(...leftArmRotation);
    if (rightArmRef.current) rightArmRef.current.rotation.set(...rightArmRotation);
  });

  return (
    <group scale={scale} position={position} rotation={rotation}>
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
  
  useEffect(() => { 
    if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; 
  }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28)) : new THREE.Vector3(-24.5, 3.5, -450);
    const targetLook = isHome ? new THREE.Vector3(20, 1.2, -2) : new THREE.Vector3(-24.5, 1.5, -1000);
    camera.position.lerp(targetPos, 0.05); 
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow />

      <group position={[0, 0, 0]}>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow><boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} /></mesh>
      </group>

      <FloatingPlatform />

      <water 
        ref={waterRef} 
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), sunColor: 0xffffff, waterColor: TITLE_PURPLE, distortionScale: 1.0, alpha: 0.95 }]} 
        rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]} 
      />
    </>
  );
}