import { useRef, useMemo, useState } from "react";
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
  const { camera } = useThree();
  const waterRef = useRef();
  const sunPlasmaRef = useRef(); 
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const [introFinished, setIntroFinished] = useState(false);
  const baseUrl = import.meta.env.BASE_URL || "/";

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  // Load noise texture for the sun's surface movement
  const sunPlasmaTex = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

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
    if (waterNormals) {
      waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    }
  }, [pinkStoneTex, sunPlasmaTex, waterNormals]);

  const pinkProps = {
    map: pinkStoneTex,
    color: "#fcd7d7",
    roughness: 0.65,
    metalness: 0.05,
  };

  useMemo(() => {
    camera.position.set(65, 8.5, 12); 
    lookAtTarget.current.set(0, 8.5, 12);
    camera.lookAt(lookAtTarget.current);
  }, [camera]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.008;

    const introCenterPoint = new THREE.Vector3(5, 8.5, 12);
    const sweetSpotPos = new THREE.Vector3(-15, 1.5, 30);
    const sweetSpotLook = new THREE.Vector3(12, 1.5, 0);

    const doorClearancePos = new THREE.Vector3(-8, 1.5, 10);
    const exitFinalPos = new THREE.Vector3(-8, 1.5, -80);
    const exitLook = new THREE.Vector3(-8, 1.5, -150);

    if (!introFinished && isHome) {
      if (camera.position.x > 8) {
        camera.position.lerp(introCenterPoint, LERP_SPEED);
        lookAtTarget.current.lerp(new THREE.Vector3(-20, 8.5, 12), LERP_SPEED);
      } else {
        setIntroFinished(true);
      }
    } else if (isHome) {
      camera.position.lerp(sweetSpotPos, LERP_SPEED);
      lookAtTarget.current.lerp(sweetSpotLook, LERP_SPEED);
    } else {
      if (camera.position.z > 12) {
        camera.position.lerp(doorClearancePos, LERP_SPEED);
        lookAtTarget.current.lerp(exitLook, LERP_SPEED);
      } else {
        camera.position.lerp(exitFinalPos, LERP_SPEED);
        lookAtTarget.current.lerp(exitLook, LERP_SPEED);
      }
    }

    camera.lookAt(lookAtTarget.current);

    // Tropical Water Animation
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.15;
    }

    // Enhanced Lava Sun Animation (Multi-axis churn)
    if (sunPlasmaRef.current) {
      sunPlasmaRef.current.offset.x += delta * 0.06;
      sunPlasmaRef.current.offset.y += delta * 0.03;
    }
  });

  return (
    <>
      {/* DREAMY SKY */}
      <Sky
        distance={450000}
        sunPosition={[-10, 6, -100]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={12}
        rayleigh={0.3}
        mieCoefficient={0.02}
        mieDirectionalG={0.95}
      />

     {/* GODLIKE SUN - Enhanced "Alive" Lava Globe */}
      <mesh position={[-10, 45, -180]}>
        <sphereGeometry args={[22, 64, 64]} />
        <meshStandardMaterial 
          color="#ffca7d" 
          emissive="#ff8c00" 
          emissiveMap={sunPlasmaTex}
          emissiveIntensity={4}
          roughness={0.2}
          metalness={0.5}
        />
        {/* Soft Volumetric Warmth */}
        <pointLight intensity={4} distance={200} color="#ffaa33" decay={1.5} />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 260]} />

      {/* LOCKED IN VOLUMETRIC CLOUDS */}
      <group>
        <Cloud position={[-10, 30, -100]} speed={0.2} opacity={0.8} segments={24} bounds={[60, 20, 20]} volume={15} color="#ffd6f0" />
        <Cloud position={[-60, 45, -80]} speed={0.1} opacity={0.4} segments={12} bounds={[40, 20, 20]} volume={5} color="#fbcfe8" />
        <Cloud position={[40, 50, -120]} speed={0.15} opacity={0.5} segments={20} bounds={[100, 30, 30]} volume={10} color="#e9d5ff" />
        <Cloud position={[0, 60, -150]} speed={0.05} opacity={0.3} segments={10} bounds={[200, 40, 40]} volume={20} color="#ffffff" />
        <Cloud position={[100, 30, -50]} speed={0.2} opacity={0.6} segments={15} bounds={[50, 20, 20]} volume={6} color="#dbeafe" />
      </group>

      {/* LIGHTING - ULTRA LIGHT & NO DARK SHADOWS */}
      <ambientLight intensity={1.2} color="#ffffff" />
      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#00f2ff" />
      
      {/* Very soft directional light just for a hint of shape */}
      <directionalLight 
        position={[-15, 30, 10]} 
        intensity={0.3} 
        castShadow={false} /* Turned off shadow casting to keep everything light */
      />
      
      <pointLight position={[10, 5, 10]} intensity={1.5} color="#ffd6e7" />
      <pointLight position={[0, 3, 0]} intensity={1} color="#ffffff" />

      {/* STRUCTURE */}
      <group position={[0, 0, 0]}>
        <mesh position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>

        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />

        <group position={[-16, -1, 0]}>
          <mesh position={[1, 8.5, 0]}>
            <boxGeometry args={[4, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh position={[24, 8.5, 0]}>
            <boxGeometry args={[18, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
        </group>

        <group position={[17, -1, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[4, 8.5, 0]}>
            <boxGeometry args={[8, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <mesh position={[24, 8.5, 0]}>
            <boxGeometry args={[8, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
        </group>
      </group>

      {/* TROPICAL PARADISE WATER */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(0, 1, 0), // Shifted to prevent horizontal white glare
            sunColor: 0x00d9ff, // Water catches cyan light instead of white
            waterColor: 0x006b80, // Deep tropical teal
            distortionScale: 1.5, // Gentler ripples
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      />
    </>
  );
}