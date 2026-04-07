import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Float, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

function PinkClouds() {
  const cloudsRef = useRef();

  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 3;
    }
  });

  return (
    <group ref={cloudsRef}>
      <mesh position={[-40, 35, -80]}>
        <sphereGeometry args={[25, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.12} />
      </mesh>
      <mesh position={[40, 45, -100]}>
        <sphereGeometry args={[30, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // TEXTURES
  const pinkStoneTex = useLoader(
    THREE.TextureLoader,
    `${baseUrl}textures/stone_pillar.jpg`
  );
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  useMemo(() => {
    pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
    pinkStoneTex.repeat.set(2, 2);
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, waterNormals]);

  // CAMERA
  const views = {
    home: { pos: [12, 6, 18], look: [0, 6, 0] },
    collection: { pos: [-18, 10, 25], look: [-5, 6, -5] },
  };

  const targetLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03);
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);

    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.4;
    }
  });

  return (
    <>
      {/* SKY + LIGHTING */}
      <Sky sunPosition={[10, 5, 10]} turbidity={2} rayleigh={1.5} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#f7ece8", 10, 120]} />

      <directionalLight
        position={[15, 20, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <PinkClouds />

      {/* ARCHITECTURE */}
      <group position={[0, 0, -5]}>
        {/* BACK WALL */}
        <mesh position={[0, 12, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 24, 0.6]} />
          <meshStandardMaterial map={pinkStoneTex} color="#f2dcd5" />
        </mesh>

        {/* SIDE WALL */}
        <mesh
          position={[-10, 12, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
        >
          <boxGeometry args={[20, 24, 0.6]} />
          <meshStandardMaterial color="#e8cfc8" />
        </mesh>

        {/* ARCH CUTOUT (FAKE BUT CLEAN) */}
        <mesh position={[-5, 8, -9.7]}>
          <cylinderGeometry args={[4, 4, 0.7, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#f7ece8" />
        </mesh>

        {/* WINDOW CUTOUT */}
        <mesh position={[5, 14, -9.7]}>
          <boxGeometry args={[3, 10, 0.7]} />
          <meshStandardMaterial color="#f7ece8" />
        </mesh>

        {/* PLATFORM */}
        <mesh position={[-10, 0.3, 0]} castShadow receiveShadow>
  <boxGeometry args={[18, 0.6, 18]} />
  <meshStandardMaterial
    map={pinkStoneTex}
    color="#f2dcd5"
    roughness={0.85}
  />
</mesh>

       {/* --- REFINED STAIRS (INTEGRATED + MINIMAL) --- */}
<group position={[-10, -1.2, -6]}>
  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
    <mesh
      key={i}
      position={[0, i * 0.45, i * 1.05]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[6.5, 0.35, 1.8]} />
      <meshStandardMaterial
        map={pinkStoneTex}
        color="#f2dcd5"
        roughness={0.9}
      />
    </mesh>
  ))}
</group>

      {/* --- FLOATING SPHERE (FIXED COMPOSITION) --- */}
{/* --- FLOATING SPHERE (FIXED COMPOSITION) --- */}
<Float speed={0.6} rotationIntensity={0.15} floatIntensity={0.6}>
  <mesh position={[-2, 5.5, -8]}>
    <sphereGeometry args={[1.6, 64, 64]} />
    <meshPhysicalMaterial
      color="#f8e9e6"
      roughness={0.05}
      transmission={1}
      thickness={1.2}
      ior={1.4}
      clearcoat={1}
      clearcoatRoughness={0}
    />
  </mesh>
</Float>

      {/* WATER */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(3000, 3000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(10, 10, 10),
            sunColor: 0xffffff,
            waterColor: 0xa19089,
            distortionScale: 1.2,
            fog: true,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      />

      <ContactShadows
        opacity={0.4}
        scale={100}
        blur={2.5}
        far={20}
        color="#5e4d4d"
      />
    </>
  );
}