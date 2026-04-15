import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000;
const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / 25, 1.0);
  const hills = [{ x: 20, z: -100, h: 18, w: 16 }, { x: -70, z: -50, h: 12, w: 12 }, { x: 55, z: -40, h: 14, w: 14 }];
  let hillHeight = 0;
  hills.forEach(h => {
    const d = Math.sqrt(Math.pow(x - h.x, 2) + Math.pow(z - h.z, 2));
    hillHeight += Math.exp(-Math.pow(d / h.w, 2)) * h.h;
  });
  return hillHeight * influence;
};

// --- CONSISTENT COMFY RECLINER ---
const ComfyChair = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation} scale={0.7}>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[1.6, 0.7, 1.4]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} />
    </mesh>
    <mesh position={[0, 1.0, -0.4]} rotation={[-0.2, 0, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[1.6, 1.4, 0.6]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} />
    </mesh>
    <mesh position={[-0.9, 0.7, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[0.4, 0.8, 1.3]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} />
    </mesh>
    <mesh position={[0.9, 0.7, 0]} castShadow receiveShadow renderOrder={10001}>
      <boxGeometry args={[0.4, 0.8, 1.3]} />
      <meshStandardMaterial {...materialProps} color={DARKER_PINK_THEME} depthTest={false} />
    </mesh>
  </group>
);

// --- CONSISTENT ARC LAMP ---
const ArcLamp = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.05, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
      <meshStandardMaterial {...materialProps} color="#444" depthTest={false} />
    </mesh>
    <mesh position={[0, 2.5, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
      <meshStandardMaterial {...materialProps} color="#222" depthTest={false} />
    </mesh>
    <mesh position={[1.2, 5.0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={10001}>
      <cylinderGeometry args={[0.05, 0.05, 2.4, 16]} />
      <meshStandardMaterial {...materialProps} color="#222" depthTest={false} />
    </mesh>
    <mesh position={[2.4, 4.7, 0]} renderOrder={10002}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} depthTest={false} />
    </mesh>
  </group>
);

// --- THE CIRCULAR FLOATING PLATFORM ---
const FloatingPlatform = ({ butterProps }) => {
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4} position={[10, -1.1, 16]}>
      <mesh renderOrder={10000} frustumCulled={false}>
        <cylinderGeometry args={[3.8, 3.8, 0.2, 64]} /> 
        <meshStandardMaterial color="#ffffff" depthTest={false} transparent={true} opacity={0.9} />
      </mesh>

      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10001}>
        <circleGeometry args={[2.2, 64]} />
        <meshStandardMaterial color="#e8d5e0" depthTest={false} />
      </mesh>

      <ComfyChair position={[-0.5, 0.12, 0]} rotation={[0, Math.PI / 4, 0]} materialProps={butterProps} />
      <ArcLamp position={[-1.8, 0.12, -1.2]} rotation={[0, Math.PI / 4, 0]} materialProps={butterProps} />

      <group position={[-0.5, 0.6, 0]} rotation={[0, Math.PI / 4, 0]}>
         <BlockHumanoid 
            scale={0.8} 
            materialProps={{...butterProps, depthTest: false}} 
            poseProps={{ 
              leftLegRotation: [1.4, 0, 0], 
              rightLegRotation: [1.4, 0, 0], 
              leftArmRotation: [0.8, 0.2, 0.5], 
              rightArmRotation: [0.8, -0.2, -0.5],
              torsoRotationX: 0.1
            }} 
         />
      </group>

      <group position={[1.2, 0.12, 0.8]} rotation={[0, -Math.PI / 1.5, 0]}>
         <BlockHumanoid 
            isHelper
            scale={0.9} 
            materialProps={{...butterProps, depthTest: false}} 
            poseProps={{ 
              headRotationY: -0.4,
              leftArmRotation: [0.2, 0, -0.1],
              rightArmRotation: [1.1, 0, -0.3] 
            }} 
         />
      </group>
    </Float>
  );
};

// --- CONSISTENT HUMANOID SYSTEM ---
const HeartBadge = ({ depthTest = true }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.bezierCurveTo(0, 0.05, 0.1, 0.1, 0.1, 0);
    s.bezierCurveTo(0.1, -0.05, 0, -0.1, 0, -0.15); s.bezierCurveTo(0, -0.1, -0.1, -0.05, -0.1, 0);
    s.bezierCurveTo(-0.1, 0.1, 0, 0.05, 0, 0); return s;
  }, []);
  return (
    <mesh position={[0.12, 1.0, 0.19]} renderOrder={10003}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={DARKER_PINK_THEME} emissive={DARKER_PINK_THEME} emissiveIntensity={0.5} depthTest={depthTest} />
    </mesh>
  );
};

const BlockHumanoid = forwardRef(({ scale = 1, materialProps, poseProps = {}, isHelper = false }, ref) => {
  const { 
    leftLegRotation = [0, 0, 0], rightLegRotation = [0, 0, 0], leftArmRotation = [0.2, 0, -0.1], 
    rightArmRotation = [0.2, 0, 0.1], position = [0,0,0], rotation = [0,0,0], cane = false,
    walker = false, isLeaning = false, isWalking = false, walkSpeed = 8, torsoRotationZ = 0,
    torsoRotationX = 0, headRotationY = 0, animateArmsTo = null 
  } = poseProps;
  
  const torsoRef = useRef(); const leftLegRef = useRef(); const rightLegRef = useRef();
  const leftArmRef = useRef(); const rightArmRef = useRef(); const headRef = useRef(); const innerGroupRef = useRef();

  useImperativeHandle(ref, () => ({
    leftLeg: leftLegRef.current, rightLeg: rightLegRef.current, leftArm: leftArmRef.current,
    rightArm: rightArmRef.current, head: headRef.current, torso: torsoRef.current, group: innerGroupRef.current
  }));

  const limbGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.08, 0.05), new THREE.Vector2(0.08, 0.75), new THREE.Vector2(0, 0.8)];
    const g = new THREE.LatheGeometry(pts, 32); g.translate(0, -0.8, 0); return g;
  }, []);

  const torsoGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.18, 0.1), new THREE.Vector2(0.18, 0.9), new THREE.Vector2(0, 1.0)];
    return new THREE.LatheGeometry(pts, 32);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (torsoRef.current) { torsoRef.current.rotation.z = torsoRotationZ; torsoRef.current.rotation.x = torsoRotationX; if (isLeaning) torsoRef.current.rotation.z += Math.sin(t * 0.5) * 0.15; }
    if (headRef.current) headRef.current.rotation.y = headRotationY;
    if (isWalking) {
      const swing = Math.sin(t * walkSpeed) * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing; if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.5; if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.5;
    }
    if (!isWalking && leftLegRef.current) leftLegRef.current.rotation.set(...leftLegRotation);
    if (!isWalking && rightLegRef.current) rightLegRef.current.rotation.set(...rightLegRotation);
  });

  return (
    <group scale={scale} position={position} rotation={rotation} ref={innerGroupRef}>
      <group ref={torsoRef}>
        <mesh ref={headRef} position={[0, 1.4, 0]} castShadow renderOrder={10002}><sphereGeometry args={[0.22, 32, 32]} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0, 0.3, 0]} castShadow renderOrder={10002}><primitive object={torsoGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        {isHelper && <HeartBadge depthTest={materialProps.depthTest} />}
        <group position={[0, 1.2, 0]}>
          <group ref={leftArmRef} position={[-0.22, 0, 0]}><mesh castShadow renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
          <group ref={rightArmRef} position={[0.22, 0, 0]}>
            <mesh castShadow renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
              {cane && <mesh position={[0, -0.7, 0.1]} renderOrder={10003}><cylinderGeometry args={[0.015, 0.015, 1.1]} /><meshStandardMaterial color={DARKER_PINK_THEME} depthTest={materialProps.depthTest} /></mesh>}
            </mesh>
          </group>
        </group>
      </group>
      <group position={[0, 0.4, 0]}>
        <group ref={leftLegRef} position={[-0.12, 0, 0]}><mesh castShadow renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
        <group ref={rightLegRef} position={[0.12, 0, 0]}><mesh castShadow renderOrder={10002}><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
      </group>
    </group>
  );
});

// --- MAIN SCENE ---
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  useEffect(() => { if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28)) : new THREE.Vector3(-24.5, 3.5, -450);
    const targetLook = isHome ? new THREE.Vector3(20, 1.2, -2) : new THREE.Vector3(-24.5, 1.5, -1000);
    camera.position.lerp(targetPos, 0.05); camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
  });

  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow />

      <FloatingPlatform butterProps={butterProps} />

      <water 
        ref={waterRef} 
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), sunColor: 0xffffff, waterColor: TITLE_PURPLE, distortionScale: 1.0, alpha: 0.95 }]} 
        rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]} 
      />
    </>
  );
}