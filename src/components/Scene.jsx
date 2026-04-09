import { useRef, useMemo, useState } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
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
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const [introFinished, setIntroFinished] = useState(false);
  const baseUrl = import.meta.env.BASE_URL || "/";

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  useMemo(() => {
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(2, 2);
    }
  }, [pinkStoneTex]);

  const pinkProps = {
    map: pinkStoneTex,
    color: "#fcd7d7",
    roughness: 0.65,
    metalness: 0.05,
  };

  // INITIAL LOAD SETUP
  useMemo(() => {
    // Eye-level (8.5), Backed up for framing (65), Aligned with window (12)
    camera.position.set(65, 8.5, 12); 
    lookAtTarget.current.set(0, 8.5, 12);
    camera.lookAt(lookAtTarget.current);
  }, [camera]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.008; // Slow, luxurious glide for everything

    // 1. INTRO WAYPOINTS
    const introCenterPoint = new THREE.Vector3(5, 8.5, 12); // Directly inside window
    const sweetSpotPos = new THREE.Vector3(-15, 1.5, 30);
    const sweetSpotLook = new THREE.Vector3(12, 1.5, 0);

    // 2. EXIT WAYPOINTS (Door closest to stairs is at Z: -10 relative to group)
    // Absolute position for that door is roughly Z: 10
    const doorClearancePos = new THREE.Vector3(-8, 1.5, 10); // Center of doorway
    const exitFinalPos = new THREE.Vector3(-8, 1.5, -80);
    const exitLook = new THREE.Vector3(-8, 1.5, -150);

    if (!introFinished && isHome) {
        // Move straight through the window center first
        if (camera.position.x > 8) {
            camera.position.lerp(introCenterPoint, LERP_SPEED);
            lookAtTarget.current.lerp(new THREE.Vector3(-20, 8.5, 12), LERP_SPEED);
        } else {
            setIntroFinished(true);
        }
    } else if (isHome) {
        // Settle into Sweet Spot
        camera.position.lerp(sweetSpotPos, LERP_SPEED);
        lookAtTarget.current.lerp(sweetSpotLook, LERP_SPEED);
    } else {
        // EXIT: Go to the doorway center first, then glide out
        if (camera.position.z > 12) {
             camera.position.lerp(doorClearancePos, LERP_SPEED);
             lookAtTarget.current.lerp(exitLook, LERP_SPEED);
        } else {
             camera.position.lerp(exitFinalPos, LERP_SPEED);
             lookAtTarget.current.lerp(exitLook, LERP_SPEED);
        }
    }

    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.25;
    }
  });

  return (
    <>
      <Sky
  distance={450000}
  sunPosition={[-10, 6, 20]}
  inclination={0.49}
  azimuth={0.25}
  turbidity={12}
  rayleigh={0.8} // ↓ kills the heavy blue tone
  mieCoefficient={0.02}
  mieDirectionalG={0.95}
/>

<Environment preset="sunset" />

{/* FULL SCENE ATMOSPHERIC GRADIENT (this is the key) */}
<fog attach="fog" args={["#f6c1d4", 20, 250]} />

{/* MASSIVE CLOUD LAYERS (cover entire sky, not patches) */}
<mesh position={[0, 120, -200]}>
  <planeGeometry args={[2000, 800]} />
  <meshBasicMaterial
    color="#ffd6f0"
    transparent
    opacity={0.35}
    depthWrite={false}
  />
</mesh>

<mesh position={[0, 160, -300]}>
  <planeGeometry args={[2200, 900]} />
  <meshBasicMaterial
    color="#d0bfff"
    transparent
    opacity={0.25}
    depthWrite={false}
  />
</mesh>

<mesh position={[0, 200, -400]}>
  <planeGeometry args={[2400, 1000]} />
  <meshBasicMaterial
    color="#bde0fe"
    transparent
    opacity={0.2}
    depthWrite={false}
  />
</mesh>
      <directionalLight position={[-20, 25, 15]} intensity={1.3} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[10, 5, 10]} intensity={1.2} color="#ffd6e7" />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#ffc0cb" />

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        
        {/* LEFT WALL */}
        <group position={[-16, -1, 0]}>
          <mesh castShadow receiveShadow position={[1, 8.5, 0]}><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} /> {/* EXIT DOORWAY */}
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} /> 
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>

        {/* RIGHT WALL */}
        <group position={[17, -1, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[4, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
      </group>

      <ContactShadows position={[12, -1.9, 15]} opacity={0.45} scale={50} blur={2.5} far={12} />

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(-20, 25, 15),
            sunColor: 0xffffff,
            waterColor: 0xbfa6a0,
            distortionScale: 0.6,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      />
    </>
  );
}