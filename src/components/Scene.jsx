import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* Monolithic Staircase */
const Staircase = ({ position, width, texture, rotation }) => {
  const stepHeight = 0.5;
  const stepDepth = 0.8;
  const numSteps = 16;

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <group key={i} position={[0, -i * stepHeight, i * stepDepth]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, stepHeight, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} metalness={0.05} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} metalness={0.05} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* Wall Segment */
const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]}>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[openingW, 4, 2]} />
        <meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const sunPlasmaRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";

  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const sunPlasmaTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(2, 2);
    }
    if (sunPlasmaTex) {
      sunPlasmaTex.wrapS = sunPlasmaTex.wrapT = THREE.RepeatWrapping;
      sunPlasmaTex.repeat.set(1.5, 1.5);
      sunPlasmaRef.current = sunPlasmaTex;
    }
  }, [pinkStoneTex, sunPlasmaTex]);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useEffect(() => {
    // Initial snap to the closer mobile position or desktop sweet spot
    const startPos = isMobile ? new THREE.Vector3(-20, 5, 40) : new THREE.Vector3(-15, 1.5, 30);
    camera.position.copy(startPos);
    camera.lookAt(12, 1.5, 0);
  }, [camera, isMobile]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;

    const sweetSpotPos = isMobile ? new THREE.Vector3(-20, 5, 40) : new THREE.Vector3(-15, 1.5, 30);
    const sweetSpotLook = new THREE.Vector3(12, 1.5, 0);

    const exitFinalPos = new THREE.Vector3(-8, 1.5, -100);
    const exitLook = new THREE.Vector3(-8, 1.5, -200);

    if (isHome) {
      camera.position.lerp(sweetSpotPos, LERP_SPEED);
      lookAtTarget.current.lerp(sweetSpotLook, LERP_SPEED);
    } else {
      camera.position.lerp(exitFinalPos, LERP_SPEED);
      lookAtTarget.current.lerp(exitLook, LERP_SPEED);
    }

    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
    if (sunPlasmaRef.current) {
      sunPlasmaRef.current.offset.x += delta * 0.03;
      sunPlasmaRef.current.offset.y -= delta * 0.05;
    }

    // GENTLE WIND
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.4;
      if (cloudGroupRef.current.position.x > 80) cloudGroupRef.current.position.x = -80;
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 6, -100]} inclination={0.49} azimuth={0.25} turbidity={12} rayleigh={0.3} mieCoefficient={0.02} mieDirectionalG={0.95} />

      {/* TRANSLUCENT ALIVE SUN */}
      <mesh position={[-10, 45, -180]}>
        <sphereGeometry args={[isMobile ? 18 : 22, 64, 64]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffba5c" 
          emissiveMap={sunPlasmaTex}
          emissiveIntensity={4}
          transparent={true}
          opacity={0.7} 
          roughness={0.1}
          metalness={0.8}
        />
        <pointLight intensity={5} distance={400} color="#fff1d4" decay={1} />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 260]} />

      {/* WINDY CLOUD SYSTEM */}
      <group ref={cloudGroupRef}>
        {/* Clouds surrounding and crossing the sun */}
        <Cloud position={[-10, 45, -165]} speed={0.2} opacity={0.7} segments={25} bounds={[40, 15, 10]} volume={15} color="#ffd1dc" />
        <Cloud position={[20, 50, -175]} speed={0.1} opacity={0.5} segments={20} bounds={[30, 10, 5]} volume={12} color="#e6e6fa" />
        <Cloud position={[-40, 55, -170]} speed={0.15} opacity={0.4} segments={15} bounds={[50, 10, 10]} volume={10} color="#b0e0e6" />
        
        {/* Drift Layers */}
        <Cloud position={[-60, 30, -100]} speed={0.2} opacity={0.8} segments={24} bounds={[60, 20, 20]} volume={15} color="#ffd6f0" />
        <Cloud position={[60, 40, -120]} speed={0.15} opacity={0.6} segments={20} bounds={[100, 30, 30]} volume={10} color="#e9d5ff" />
        <Cloud position={[0, 60, -150]} speed={0.05} opacity={0.3} segments={10} bounds={[200, 40, 40]} volume={20} color="#ffffff" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.1} castShadow={false} />
      <pointLight position={[10, 5, 10]} intensity={0.8} color="#ffd6e7" />

      {/* STRUCTURE */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        <group position={[-16, -1, 0]}>
          <mesh castShadow receiveShadow position={[1, 8.5, 0]}><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
        <group position={[17, -1, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[4, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
      </group>
      
      <ContactShadows position={[12, -1.9, 15]} opacity={0.15} scale={60} blur={4} far={12} />

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          {
            textureWidth: isMobile ? 512 : 1024,
            textureHeight: isMobile ? 512 : 1024,
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x224455,
            distortionScale: isMobile ? 0.3 : 0.5,
            alpha: 0.8,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      />
    </>
  );
}