import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const TITLE_PURPLE = "#21162e";
const DARKER_PINK_THEME = "#bf9fb3";

// ---------------- FLOATING PLATFORM ----------------
const FloatingPlatform = () => (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
    <mesh position={[10, -1.1, 16]}>
      <cylinderGeometry args={[3, 3, 0.2, 64]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
    </mesh>
  </Float>
);

// ---------------- HUMANOID ----------------
const BlockHumanoid = ({ scale = 1, materialProps, poseProps = {}, isHelper = false }) => {
  const {
    leftLegRotation = [0, 0, 0],
    rightLegRotation = [0, 0, 0],
    leftArmRotation = [0.2, 0, -0.1],
    rightArmRotation = [0.2, 0, 0.1],
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    torsoRotationX = 0
  } = poseProps;

  return (
    <group scale={scale} position={position} rotation={rotation}>
      {/* head */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* torso */}
      <mesh position={[0, 0.5, 0]} rotation={[torsoRotationX, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 1.2, 16]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* arms */}
      <mesh position={[-0.4, 0.9, 0]} rotation={leftArmRotation}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      <mesh position={[0.4, 0.9, 0]} rotation={rightArmRotation}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* legs */}
      <mesh position={[-0.15, -0.2, 0]} rotation={leftLegRotation}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      <mesh position={[0.15, -0.2, 0]} rotation={rightLegRotation}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {isHelper && (
        <mesh position={[0.15, 1.0, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={DARKER_PINK_THEME} emissive={DARKER_PINK_THEME} emissiveIntensity={0.6} />
        </mesh>
      )}
    </group>
  );
};

// ---------------- PLATFORM SCENE ----------------
const PlatformScene = ({ butterProps }) => {
  return (
    <group position={[10, -0.9, 16]}>
      
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 64]} />
        <meshStandardMaterial color="#d6b3ff" />
      </mesh>

      {/* chair */}
      <group position={[-0.6, 0.1, 0]}>
        <mesh><boxGeometry args={[0.9, 0.25, 0.9]} /><meshStandardMaterial color="#f3d9ff" /></mesh>
        <mesh position={[0, 0.6, -0.35]}><boxGeometry args={[0.9, 0.9, 0.2]} /><meshStandardMaterial color="#f3d9ff" /></mesh>
      </group>

      {/* elder */}
      <group position={[-0.6, 0.35, 0]}>
        <BlockHumanoid
          scale={0.7}
          materialProps={butterProps}
          poseProps={{
            leftLegRotation: [Math.PI / 2, 0, 0],
            rightLegRotation: [Math.PI / 2, 0, 0],
            torsoRotationX: 0.3
          }}
        />
      </group>

      {/* lamp */}
      <group position={[0.8, 0, -0.3]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.4]} />
          <meshStandardMaterial color="#fff" />
        </mesh>

        <mesh position={[0.5, 2.2, 0]}>
          <boxGeometry args={[1, 0.05, 0.05]} />
          <meshStandardMaterial color="#fff" />
        </mesh>

        <mesh position={[1.0, 1.9, 0]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial emissive="#fff2b0" emissiveIntensity={2} color="#fff5cc" />
        </mesh>
      </group>

      {/* helper */}
      <group position={[0.9, 0.2, 0.6]}>
        <BlockHumanoid
          isHelper
          scale={0.8}
          materialProps={butterProps}
          poseProps={{
            leftArmRotation: [-1.2, 0, 0],
            rightArmRotation: [-1.2, 0, 0]
          }}
        />

        {/* tray */}
        <mesh position={[0, 0.9, 0.5]}>
          <cylinderGeometry args={[0.35, 0.35, 0.05, 32]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      </group>
    </group>
  );
};

// ---------------- MAIN SCENE ----------------
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;

  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  useEffect(() => {
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";

    const targetPos = isHome
      ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28))
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

      <directionalLight position={[-15, 30, 10]} intensity={1.6} />

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

      <FloatingPlatform />
      <PlatformScene butterProps={butterProps} />
    </>
  );
}