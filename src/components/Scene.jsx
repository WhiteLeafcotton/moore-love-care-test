import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000;
const TITLE_PURPLE = "#21162e";
const DARKER_PINK_THEME = "#bf9fb3";

// -------------------- HILLS --------------------
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);

  const flatZone = 45;
  const influence =
    dist < flatZone ? 0 : Math.min((dist - flatZone) / 25, 1.0);

  const hills = [
    { x: 20, z: -100, h: 18, w: 16 },
    { x: -70, z: -50, h: 12, w: 12 },
    { x: 55, z: -40, h: 14, w: 14 }
  ];

  let height = 0;

  for (let i = 0; i < hills.length; i++) {
    const h = hills[i];
    const dx = x - h.x;
    const dz = z - h.z;
    const d = Math.sqrt(dx * dx + dz * dz);

    const falloff = Math.exp(-(d * d) / (h.w * h.w));
    height += falloff * h.h;
  }

  return height * influence;
};

// -------------------- FLOATING PLATFORM --------------------
const FloatingPlatform = () => (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
    <mesh position={[10, -1.1, 16]} renderOrder={1000}>
      <cylinderGeometry args={[3, 3, 0.2, 64]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.85}
        depthTest={false}
      />
    </mesh>
  </Float>
);

// -------------------- PLATFORM SCENE --------------------
const PlatformScene = ({ butterProps, BlockHumanoid }) => {
  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group position={[10, -0.9, 16]}>

        {/* Rug */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[2.2, 64]} />
          <meshStandardMaterial color="#2a1d38" />
        </mesh>

        {/* Chair */}
        <group position={[-0.6, 0, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.2, 0.2, 1.2]} />
            <meshStandardMaterial color="#3b2a4d" />
          </mesh>
          <mesh position={[0, 1.1, -0.5]}>
            <boxGeometry args={[1.2, 1.2, 0.2]} />
            <meshStandardMaterial color="#3b2a4d" />
          </mesh>
        </group>

        {/* Elder */}
        <group position={[-0.6, 0.25, 0]}>
          <BlockHumanoid
            scale={0.8}
            materialProps={butterProps}
            poseProps={{
              leftLegRotation: [Math.PI / 2, 0, 0],
              rightLegRotation: [Math.PI / 2, 0, 0],
              torsoRotationX: 0.2,
              leftArmRotation: [0.4, 0, -0.2],
              rightArmRotation: [0.4, 0, 0.2],
              headRotationY: 0.2
            }}
          />
        </group>

        {/* Lamp */}
        <group position={[1.2, 0, 0]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 3]} />
            <meshStandardMaterial color="#222" />
          </mesh>

          <mesh position={[-0.7, 3, 0]}>
            <boxGeometry args={[1.4, 0.05, 0.05]} />
            <meshStandardMaterial color="#222" />
          </mesh>

          <mesh position={[-1.4, 2.6, 0]}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial
              emissive="#ffdca8"
              emissiveIntensity={2}
              color="#fff4cc"
            />
          </mesh>

          <pointLight
            position={[-1.4, 2.6, 0]}
            intensity={1.5}
            distance={6}
            color="#ffdca8"
          />
        </group>

        {/* Helper */}
        <group position={[0.9, 0, 0.4]}>
          <BlockHumanoid
            isHelper
            scale={0.9}
            materialProps={butterProps}
            poseProps={{
              rotation: [0, -0.6, 0],
              leftArmRotation: [-1.2, 0, -0.1],
              rightArmRotation: [-1.2, 0, 0.1]
            }}
          />

          <mesh position={[0, 1.2, 0.6]}>
            <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
            <meshStandardMaterial color="#d8bfae" />
          </mesh>

          <mesh position={[0, 1.3, 0.6]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#ff8a8a" />
          </mesh>
        </group>

      </group>
    </Float>
  );
};

// -------------------- MAIN SCENE --------------------
export default function Scene({ currentView, BlockHumanoid }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;

  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  useEffect(() => {
    if (waterNormals) {
      waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    }
  }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";

    const targetPos = isHome
      ? (isMobile
          ? new THREE.Vector3(-18, 4.5, 38)
          : new THREE.Vector3(-13, 3.2, 28))
      : new THREE.Vector3(-24.5, 3.5, -450);

    const targetLook = isHome
      ? new THREE.Vector3(20, 1.2, -2)
      : new THREE.Vector3(-24.5, 1.5, -1000);

    camera.position.lerp(targetPos, 0.05);
    camera.lookAt(targetLook);

    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.08;
    }
  });

  const butterProps = {
    color: "#fce4e4",
    roughness: 0.9,
    metalness: 0.02
  };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} />
      <Environment preset="sunset" />

      {/* WATER */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          {
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
            waterColor: TITLE_PURPLE,
            distortionScale: 1.0,
            alpha: 0.95
          }
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.45, 0]}
      />

      {/* PLATFORM */}
      <FloatingPlatform />
      <PlatformScene butterProps={butterProps} BlockHumanoid={BlockHumanoid} />
    </>
  );
}