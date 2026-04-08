import { useRef, useMemo } from "react";
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

  // ... (rest of the code remains exactly the same)

  // ... (rest of the code remains exactly the same)

  useFrame((state, delta) => {
    // CAMERA HEIGHT: 1.5 (Level shot, just above water)
    const isHome = currentView === "home";
    
    // CONSISTENT TRAVEL LOGIC:
    // We aim for X: -10 because the wall is at -16 and the door opening is +6 from there.
    // This provides a perfectly straight line through the door in view.
    
    const targetPos = isHome 
      ? [-10, 1.5, 40]   // Start further back but already lined up with the door
      : [-10, 1.5, -20];  // Move straight through the door to the second location
    
    const targetLook = isHome 
      ? [-10, 1.5, 0]    // Look straight through the doorway center
      : [-10, 1.5, -100]; // Keep looking straight ahead as you pass through

    camera.position.lerp(new THREE.Vector3(...targetPos), 0.02);
    camera.lookAt(new THREE.Vector3(...targetLook));

    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.25;
    }
  });

// ... (rest of the code remains exactly the same)

// ... (rest of the code remains exactly the same)

  return (
    <>
      <Sky sunPosition={[-35, 5, 15]} />
      <Environment preset="sunset" />

      <directionalLight
        position={[-20, 25, 15]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <pointLight position={[10, 5, 10]} intensity={1.2} color="#ffd6e7" />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#ffc0cb" />

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>

        <Staircase
          position={[5.0, 1.5, 1.0]}
          rotation={[0, -Math.PI / 2, 0]}
          width={20}
          texture={pinkStoneTex}
        />

        <group position={[-16, -1, 0]}>
          <mesh castShadow receiveShadow position={[1, 8.5, 0]}>
            <boxGeometry args={[4, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}>
            <boxGeometry args={[18, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
        </group>

        <group position={[17, -1, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[4, 8.5, 0]}>
            <boxGeometry args={[8, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}>
            <boxGeometry args={[8, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
        </group>
      </group>

      <ContactShadows
        position={[12, -1.9, 15]}
        opacity={0.45}
        scale={50}
        blur={2.5}
        far={12}
      />

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