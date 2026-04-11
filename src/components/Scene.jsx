import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Water } from "@react-three/drei";
import { Water as WaterLib } from "three-stdlib";
import * as THREE from "three";

extend({ Water: WaterLib });

const GRASS_COUNT = 40000; 

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

/* --- SHARED GEOMETRY HELPERS --- */
const useLimbGeometry = () => useMemo(() => {
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.08, 0.05), new THREE.Vector2(0.08, 0.7), new THREE.Vector2(0, 0.75)];
  const g = new THREE.LatheGeometry(pts, 32);
  g.translate(0, -0.75, 0); // This sets the pivot to the TOP of the limb
  return g;
}, []);

const useTorsoGeometry = () => useMemo(() => {
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.18, 0.1), new THREE.Vector2(0.18, 0.9), new THREE.Vector2(0, 1.0)];
  return new THREE.LatheGeometry(pts, 32);
}, []);

/* --- UPDATED HUMANOID COMPONENT --- */
const BlockHumanoid = ({ scale = 1, materialProps, legless = false, poseProps = {} }) => {
  const limbGeo = useLimbGeometry();
  const torsoGeo = useTorsoGeometry();
  
  const { 
    leftLegRotation = [0, 0, 0], 
    rightLegRotation = [0, 0, 0], 
    leftArmRotation = [0.2, 0, -0.1], 
    rightArmRotation = [0.2, 0, 0.1], 
    position = [0,0,0], 
    cane = false 
  } = poseProps;

  return (
    <group scale={scale} position={position}>
      {/* Head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <primitive object={torsoGeo} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      
      {/* Legs */}
      {!legless && (
        <group position={[0, 0.4, 0]}>
          <mesh position={[-0.12, 0, 0]} rotation={leftLegRotation} castShadow>
            <primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.12, 0, 0]} rotation={rightLegRotation} castShadow>
            <primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      )}

      {/* Arms */}
      <group position={[0, 1.2, 0]}>
        <mesh position={[-0.22, 0, 0]} rotation={leftArmRotation} castShadow>
          <primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.22, 0, 0]} rotation={rightArmRotation} castShadow>
          <primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
          {cane && (
             <mesh position={[0, -0.7, 0.1]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 1.1]} /><meshStandardMaterial color="#fcd7d7" />
            </mesh>
          )}
        </mesh>
      </group>
    </group>
  );
};

const SimpleWheelchair = ({ materialProps, frameColor }) => (
  <group>
    <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.6, 0.08, 0.6]} /><meshStandardMaterial color="#fce4e4" /></mesh>
    <mesh position={[0, 0.9, -0.25]} rotation={[0.1, 0, 0]} castShadow><boxGeometry args={[0.55, 0.7, 0.08]} /><meshStandardMaterial color="#fce4e4" /></mesh>
    <group position={[0, 0.45, -0.05]}>
      <mesh position={[-0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.4, 0.04, 16, 50]} /><meshStandardMaterial color="#2d1d3d" /></mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.4, 0.04, 16, 50]} /><meshStandardMaterial color="#2d1d3d" /></mesh>
    </group>
  </group>
);

const WallOpening = ({ position, colorProps, width = 6, openingW = 4.8, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[openingW, 4, 2]} /><meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

const Staircase = ({ position, width, rotation, materialProps }) => {
  const stepHeight = 0.5; const stepDepth = 0.8; const numSteps = 16;
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <group key={i} position={[0, -i * stepHeight, i * stepDepth]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, stepHeight, stepDepth]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  useFrame((state, delta) => {
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
    // Basic camera movement logic (can be expanded based on your currentView state)
    if (currentView === "home") {
        camera.position.lerp(new THREE.Vector3(-14, 3.2, 24), 0.04);
        camera.lookAt(20, 1.2, -2);
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#f8e1ff", 10, 400]} />
      
      {/* Architecture Group */}
      <group position={[0, 0, 0]}>
        {/* Floor Base */}
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow>
          <boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} />
        </mesh>
        
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />
        
        {/* THE BACK WALL - RESTORED */}
        <group position={[-16, -1.6, 0]}>
          <mesh position={[1, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={butterProps} />
          <WallOpening position={[12, 0, 0]} colorProps={butterProps} />
          <mesh position={[24, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        {/* CHARACTERS */}
        
        {/* Couple B (Middle) - LOCKED */}
        <group position={[14, 1.9, 12]} rotation={[0, -Math.PI * 0.7, 0]}>
          <BlockHumanoid scale={1} materialProps={butterProps} poseProps={{ cane: true, leftLegRotation: [0.3, 0, 0], rightLegRotation: [-0.3, 0, 0], position: [-0.3, 0, 0]}} />
          <BlockHumanoid scale={0.9} materialProps={butterProps} poseProps={{ leftLegRotation: [-0.3, 0, 0], rightLegRotation: [0.3, 0, 0], position: [0.4, 0, -0.1]}} />
        </group>

        {/* Stair Couple - FIXED LOWER BODIES (Seated Position) */}
        <group position={[6.5, 1.2, 7.5]} rotation={[0, -Math.PI / 2, 0]}>
          <BlockHumanoid scale={0.9} materialProps={butterProps} poseProps={{ leftLegRotation: [1.4, 0, 0], rightLegRotation: [1.4, 0, 0] }} />
          <BlockHumanoid scale={0.88} materialProps={butterProps} poseProps={{ leftLegRotation: [1.4, 0, 0], rightLegRotation: [1.4, 0, 0], position: [0, 0, 0.7] }} />
        </group>

        {/* Wheelchair Couple - FIXED PROFILE VIEW */}
        <group position={[17, 1.9, 18]} rotation={[0, Math.PI / 2, 0]}> 
          <SimpleWheelchair materialProps={butterProps} frameColor="#fcd7d7" />
          {/* Person in chair */}
          <group position={[0, 0.2, 0]}>
            <BlockHumanoid scale={0.85} materialProps={butterProps} legless={false} poseProps={{ leftLegRotation: [1.5, 0, 0], rightLegRotation: [1.5, 0, 0], leftArmRotation: [0.7, 0, 0], rightArmRotation: [0.7, 0, 0]}} />
          </group>
          {/* Person pushing */}
          <group position={[0, 0, -0.7]}>
            <BlockHumanoid scale={0.95} materialProps={butterProps} poseProps={{ leftArmRotation: [-1.1, 0, 0.1], rightArmRotation: [-1.1, 0, -0.1]}} />
          </group>
        </group>
      </group>

      {/* Water Component */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#21162e" transparent opacity={0.8} />
      </mesh>
    </>
  );
}