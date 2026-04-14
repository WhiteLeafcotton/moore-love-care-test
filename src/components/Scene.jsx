import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 
const GRASS_COUNT = 400000;

// --- HEIGHT LOGIC ---
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

// --- HUMANOID COMPONENTS ---
const HeartBadge = () => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0, 0.05, 0.1, 0.1, 0.1, 0);
    s.bezierCurveTo(0.1, -0.05, 0, -0.1, 0, -0.15);
    s.bezierCurveTo(0, -0.1, -0.1, -0.05, -0.1, 0);
    s.bezierCurveTo(-0.1, 0.1, 0, 0.05, 0, 0);
    return s;
  }, []);
  return (
    <mesh position={[0.12, 1.0, 0.19]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={DARKER_PINK_THEME} emissive={DARKER_PINK_THEME} emissiveIntensity={0.5} />
    </mesh>
  );
};

const BlockHumanoid = forwardRef(({ scale = 1, materialProps, poseProps = {}, isHelper = false }, ref) => {
  const { 
    leftLegRotation = [0, 0, 0], rightLegRotation = [0, 0, 0], 
    leftArmRotation = [0.2, 0, -0.1], rightArmRotation = [0.2, 0, 0.1], 
    position = [0,0,0], rotation = [0,0,0],
    torsoRotationX = 0, headRotationY = 0 
  } = poseProps;
  
  const torsoGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.18, 0.1), new THREE.Vector2(0.18, 0.9), new THREE.Vector2(0, 1.0)];
    return new THREE.LatheGeometry(pts, 32);
  }, []);

  const limbGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.08, 0.05), new THREE.Vector2(0.08, 0.75), new THREE.Vector2(0, 0.8)];
    const g = new THREE.LatheGeometry(pts, 32);
    g.translate(0, -0.8, 0); return g;
  }, []);

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <group rotation={[torsoRotationX, 0, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <primitive object={torsoGeo} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        {isHelper && <HeartBadge />}
        <group position={[0, 1.2, 0]}>
          <mesh position={[-0.22, 0, 0]} rotation={leftArmRotation} castShadow>
            <primitive object={limbGeo} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.22, 0, 0]} rotation={rightArmRotation} castShadow>
            <primitive object={limbGeo} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      </group>
      <group position={[0, 0.4, 0]}>
        <mesh position={[-0.12, 0, 0]} rotation={leftLegRotation} castShadow>
          <primitive object={limbGeo} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh position={[0.12, 0, 0]} rotation={rightLegRotation} castShadow>
          <primitive object={limbGeo} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      </group>
    </group>
  );
});

// --- SCENE HELPERS ---
const GrassySassyHills = () => {
  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) { pos[i + 1] = getHillHeight(pos[i], pos[i + 2]); }
    g.computeVertexNormals(); return g;
  }, []);
  return <group position={[0, -3.5, -40]}><mesh geometry={terrainGeo} receiveShadow><meshStandardMaterial color="#0c020f" roughness={1} /></mesh></group>;
};

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

// --- MAIN SCENE EXPORT ---
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

      {/* Architecture */}
      <group position={[0, 0, 0]}>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow><boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} /></mesh>
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />
      </group>

      {/* Water */}
      <water 
        ref={waterRef} 
        args={[new THREE.PlaneGeometry(2000, 2000), { 
            waterNormals, sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), 
            waterColor: TITLE_PURPLE, distortionScale: 1.0, alpha: 0.95 
        }]} 
        rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]} 
      />

      {/* WHOLESOME PLATFORM SCENE - Placed last to ensure render visibility */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[10, -1.1, 16]}>
          {/* The Disk */}
          <mesh renderOrder={10000}>
            <cylinderGeometry args={[3, 3, 0.2, 64]} /> 
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthTest={false} />
          </mesh>

          {/* Rug */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
            <circleGeometry args={[2.2, 64]} />
            <meshStandardMaterial color="#d6b3ff" />
          </mesh>

          {/* Comfy Chair */}
          <group position={[-0.6, 0.2, 0]} rotation={[0, 0.5, 0]}>
            <mesh castShadow><boxGeometry args={[1.2, 0.3, 1.2]} /><meshStandardMaterial color="#f3d9ff" /></mesh>
            <mesh position={[0, 0.6, -0.5]} castShadow><boxGeometry args={[1.2, 1, 0.2]} /><meshStandardMaterial color="#f3d9ff" /></mesh>
          </group>

          {/* Old Person Sitting */}
          <BlockHumanoid
            scale={0.7}
            materialProps={butterProps}
            poseProps={{
              position: [-0.6, 0.45, 0],
              rotation: [0, 0.5, 0],
              leftLegRotation: [Math.PI / 2, 0.2, 0],
              rightLegRotation: [Math.PI / 2, -0.2, 0],
              torsoRotationX: 0.2,
              leftArmRotation: [0.5, 0, 0.2],
              rightArmRotation: [0.5, 0, -0.2]
            }}
          />

          {/* L-Lamp */}
          <group position={[0.7, 0.1, -0.8]}>
            <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 2.4]} /><meshStandardMaterial color="#ffffff" /></mesh>
            <mesh position={[0.4, 2.4, 0]} castShadow><boxGeometry args={[0.8, 0.04, 0.04]} /><meshStandardMaterial color="#ffffff" /></mesh>
            <mesh position={[0.8, 2.2, 0]}><sphereGeometry args={[0.15, 32, 32]} /><meshStandardMaterial emissive="#fff2b0" emissiveIntensity={2} color="#fff5cc" /></mesh>
          </group>

          {/* Helper with Platter */}
          <group position={[1.2, 0.1, 0.8]} rotation={[0, -0.8, 0]}>
            <BlockHumanoid
              isHelper
              scale={0.8}
              materialProps={butterProps}
              poseProps={{
                leftArmRotation: [-1.1, 0, 0.2],
                rightArmRotation: [-1.1, 0, -0.2]
              }}
            />
            {/* Platter */}
            <mesh position={[0, 0.9, 0.4]}>
              <cylinderGeometry args={[0.35, 0.35, 0.03, 32]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>
      </Float>
    </>
  );
}