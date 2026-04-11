import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Cloud, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* --- GEOMETRY HELPERS --- */
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

/* --- THE NEW ROUNDED BLOCK HUMANOID --- */
const BlockHumanoid = ({ scale = 1, materialProps, pose = 'standing', poseProps = {} }) => {
  const { torsoRotation = [0, 0, 0], leftLegRotation = [0, 0, 0], rightLegRotation = [0, 0, 0], leftArmRotation = [0.2, 0, -0.1], rightArmRotation = [0.2, 0, 0.1], position = [0,0,0], cane = false } = poseProps;
  
  // Custom lathe shape for that "soft block" or "pillow" look
  const limbPoints = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(0.08, 0.1));
    pts.push(new THREE.Vector2(0.08, 0.8));
    pts.push(new THREE.Vector2(0, 0.9));
    return pts;
  }, []);

  const torsoPoints = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(0.18, 0.1));
    pts.push(new THREE.Vector2(0.18, 1.0));
    pts.push(new THREE.Vector2(0, 1.1));
    return pts;
  }, []);

  return (
    <group scale={scale} position={position}>
      {/* Head: Gap closed to be just a sliver */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      
      {/* Torso: Rounded block */}
      <mesh position={[0, 1.45, 0]} castShadow receiveShadow rotation={[0,0,Math.PI]}>
        <latheGeometry args={[torsoPoints, 32]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      
      {/* Legs: Planted or Seated */}
      <group position={[0, 0.4, 0]}>
        <mesh position={[-0.1, -0.4, 0]} castShadow receiveShadow rotation={leftLegRotation}>
          <latheGeometry args={[limbPoints, 32]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.1, -0.4, 0]} castShadow receiveShadow rotation={rightLegRotation}>
          <latheGeometry args={[limbPoints, 32]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      </group>

      {/* Arms: Proportionate and posed */}
      <group position={[0, 1.3, 0]}>
        <mesh position={[-0.22, -0.4, 0]} castShadow receiveShadow rotation={leftArmRotation}>
          <latheGeometry args={[limbPoints, 32]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.22, -0.4, 0]} castShadow receiveShadow rotation={rightArmRotation}>
          <latheGeometry args={[limbPoints, 32]} />
          <meshStandardMaterial {...materialProps} />
          {cane && (
             <mesh position={[0, -0.5, 0.1]} castShadow receiveShadow>
                <cylinderGeometry args={[0.015, 0.015, 1.2]} /><meshStandardMaterial color="#fcd7d7" />
            </mesh>
          )}
        </mesh>
      </group>
    </group>
  );
};

/* --- HIGH FIDELITY WHEELCHAIR --- */
const ArchitecturalWheelchair = ({ frameColor, materialProps }) => (
  <group>
    {/* Frame */}
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[0.6, 0.1, 0.7]} /><meshStandardMaterial color={frameColor} />
    </mesh>
    <mesh position={[0, 0.9, -0.3]} castShadow>
      <boxGeometry args={[0.6, 0.8, 0.05]} /><meshStandardMaterial color={frameColor} />
    </mesh>
    {/* Large Rear Wheels */}
    <group position={[0, 0.4, -0.1]}>
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
        <torusGeometry args={[0.4, 0.03, 16, 100]} /><meshStandardMaterial color="#2d1d3d" />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
        <torusGeometry args={[0.4, 0.03, 16, 100]} /><meshStandardMaterial color="#2d1d3d" />
      </mesh>
    </group>
    {/* Handles */}
    <group position={[0, 1.3, -0.35]}>
      <mesh position={[-0.25, 0, -0.1]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} /><meshStandardMaterial color={frameColor} />
      </mesh>
      <mesh position={[0.25, 0, -0.1]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} /><meshStandardMaterial color={frameColor} />
      </mesh>
    </group>
  </group>
);

/* --- MAIN SCENE --- */
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? new THREE.Vector3(-14, 3.2, 24) : new THREE.Vector3(-24.5, 3.5, -450);
    camera.position.lerp(targetPos, 0.04);
    camera.lookAt(20, 1.2, -2);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
  });

  return (
    <>
      <Sky sunPosition={[-20, 8, -100]} />
      <Environment preset="sunset" />
      
      {/* Sanctuary Architecture */}
      <group position={[15.5, -2.1, 15.0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} />
        </mesh>
      </group>

      {/* FIXED Staircase & Seated Couple */}
      <group position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]}>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[0, -i * 0.5, i * 0.8]} castShadow receiveShadow>
            <boxGeometry args={[17.5, 0.5, 0.8]} /><meshStandardMaterial {...butterProps} />
          </mesh>
        ))}
        {/* Intimate Couple sitting on the 2nd step */}
        <group position={[3, -0.5, 0.8]}>
           <BlockHumanoid scale={0.9} materialProps={butterProps} 
             poseProps={{ 
               leftLegRotation: [Math.PI/2, 0, 0], 
               rightLegRotation: [Math.PI/2, 0, 0],
               leftArmRotation: [0.5, 0.5, 0],
               position: [-0.4, -0.4, 0] 
             }} />
           <BlockHumanoid scale={0.88} materialProps={butterProps} 
             poseProps={{ 
               leftLegRotation: [Math.PI/2, 0, 0], 
               rightLegRotation: [Math.PI/2, 0, 0],
               rightArmRotation: [0.5, -0.5, 0],
               position: [0.4, -0.4, 0] 
             }} />
        </group>
      </group>

      {/* Wheelchair Couple */}
      <group position={[16, 1.9, 18]} rotation={[0, Math.PI/2, 0]}>
        <ArchitecturalWheelchair frameColor="#fcd7d7" materialProps={butterProps} />
        {/* Seated in chair */}
        <BlockHumanoid scale={0.85} materialProps={butterProps} 
          poseProps={{ 
            leftLegRotation: [1.2, 0, 0], 
            rightLegRotation: [1.2, 0, 0],
            position: [0, 0.1, 0] 
          }} />
        {/* Helper behind handles */}
        <BlockHumanoid scale={0.95} materialProps={butterProps} 
          poseProps={{ 
            leftArmRotation: [-1.2, 0, 0.1], 
            rightArmRotation: [-1.2, 0, -0.1],
            position: [0, 0, -0.7] 
          }} />
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunColor: 0xffffff, waterColor: 0x21162e }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.45, 0]}
      />
    </>
  );
}