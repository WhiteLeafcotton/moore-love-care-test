import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

// Register the Water component with R3F
extend({ Water });

const TITLE_PURPLE = "#21162e";

const FloatingPlatform = () => {
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

const PlatformScene = ({ butterProps, BlockHumanoid }) => {
  // Guard clause: If BlockHumanoid isn't passed, don't crash the scene
  if (!BlockHumanoid) return null;

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group position={[10, -0.9, 16]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[2.2, 64]} />
          <meshStandardMaterial color="#2a1d38" />
        </mesh>

        <group position={[-0.6, 0, 0]}>
          <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.2, 0.2, 1.2]} /><meshStandardMaterial color="#3b2a4d" /></mesh>
          <mesh position={[0, 1.1, -0.5]}><boxGeometry args={[1.2, 1.2, 0.2]} /><meshStandardMaterial color="#3b2a4d" /></mesh>
        </group>

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

        <group position={[1.2, 0, 0]}>
          <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.05, 0.05, 3]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[-0.7, 3, 0]}><boxGeometry args={[1.4, 0.05, 0.05]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[-1.4, 2.6, 0]}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial emissive="#ffdca8" emissiveIntensity={4} color="#fff4cc" />
          </mesh>
          <pointLight position={[-1.4, 2.6, 0]} intensity={2} distance={8} color="#ffdca8" />
        </group>

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
        </group>
      </group>
    </Float>
  );
};

export default function Scene({ currentView = "home", BlockHumanoid }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(10, 1.2, 10));
  const isMobile = size.width < 768;

  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  useEffect(() => {
    if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [waterNormals]);

  // Create the Water instance manually to avoid "water is undefined" error
  const waterInstance = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10000, 10000);
    return new Water(geo, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
      sunColor: 0xffffff,
      waterColor: TITLE_PURPLE,
      distortionScale: 3.7,
      fog: false
    });
  }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome
      ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28))
      : new THREE.Vector3(-24.5, 3.5, -450);

    const targetLook = isHome ? new THREE.Vector3(10, 1.2, 10) : new THREE.Vector3(-24.5, 1.5, -1000);

    camera.position.lerp(targetPos, 0.05);
    lookAtTarget.current.lerp(targetLook, 0.05);
    camera.lookAt(lookAtTarget.current);

    if (waterInstance) {
      waterInstance.material.uniforms["time"].value += delta * 0.5;
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.4} />

      {/* Use primitive to ensure the Water object is rendered safely */}
      <primitive 
        object={waterInstance} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.45, 0]} 
      />

      <FloatingPlatform />
      <PlatformScene 
        butterProps={{ color: "#fce4e4", roughness: 0.8, metalness: 0.1 }} 
        BlockHumanoid={BlockHumanoid} 
      />
    </>
  );
}