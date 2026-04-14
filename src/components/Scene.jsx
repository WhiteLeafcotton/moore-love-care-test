import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const TITLE_PURPLE = "#21162e";

// -------------------- FLOATING PLATFORM --------------------
const FloatingPlatform = () => {
  // Memoize geometry to prevent re-allocation on every render
  const geo = useMemo(() => new THREE.CylinderGeometry(3, 3, 0.2, 64), []);
  
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh position={[10, -1.1, 16]} geometry={geo}>
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
    </Float>
  );
};

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
              emissiveIntensity={4}
              color="#fff4cc"
            />
          </mesh>

          <pointLight
            position={[-1.4, 2.6, 0]}
            intensity={2}
            distance={8}
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
  
  // Ref for camera look-at target to ensure smooth rotation lerping
  const lookAtTarget = useRef(new THREE.Vector3(20, 1.2, -2));
  
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

  // Memoize Water config
  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(2000, 2000), []);
  const waterOptions = useMemo(() => ({
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
    sunColor: 0xffffff,
    waterColor: TITLE_PURPLE,
    distortionScale: 3.7,
    fog: false
  }), [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";

    // Position Targets
    const targetPos = isHome
      ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28))
      : new THREE.Vector3(-24.5, 3.5, -450);

    // LookAt Targets
    const targetLook = isHome
      ? new THREE.Vector3(10, 1.2, 10) // Focus on the platform
      : new THREE.Vector3(-24.5, 1.5, -1000);

    // Lerp both position AND the lookAt point for maximum smoothness
    camera.position.lerp(targetPos, 0.05);
    lookAtTarget.current.lerp(targetLook, 0.05);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.5;
    }
  });

  const butterProps = {
    color: "#fce4e4",
    roughness: 0.8,
    metalness: 0.1
  };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} />
      <Environment preset="sunset" />

      <ambientLight intensity={0.4} />
      <directionalLight position={[-10, 10, 5]} intensity={1} />

      {/* WATER */}
      <water
        ref={waterRef}
        args={[waterGeometry, waterOptions]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.45, 0]}
      />

      {/* PLATFORM SCENE */}
      <FloatingPlatform />
      <PlatformScene butterProps={butterProps} BlockHumanoid={BlockHumanoid} />
    </>
  );
}