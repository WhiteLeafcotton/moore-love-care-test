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
      cloudsRef.current.position.x =
        Math.sin(state.clock.elapsedTime * 0.05) * 3;
    }
  });

  return (
    <group ref={cloudsRef}>
      <mesh position={[-40, 35, -80]}>
        <sphereGeometry args={[25, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.1} />
      </mesh>
      <mesh position={[40, 45, -100]}>
        <sphereGeometry args={[30, 32, 16]} />
        <meshStandardMaterial color="#fcd7d7" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

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
    pinkStoneTex.repeat.set(1.5, 1.5);

    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, waterNormals]);

  // CAMERA (UNCHANGED)
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
      {/* LIGHTING (UPGRADED FOR DEPTH) */}
      <Sky sunPosition={[8, 6, 5]} turbidity={2} rayleigh={1.2} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#f7ece8", 8, 120]} />

      <directionalLight
        position={[8, 12, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* SOFT FILL LIGHT (KEY ADDITION) */}
      <directionalLight position={[-5, 6, -5]} intensity={0.4} />

      <PinkClouds />

      {/* ARCHITECTURE */}
      <group position={[0, 0, -5]}>
        {/* BACK WALL */}
        <mesh position={[0, 12, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 24, 0.5]} />
          <meshStandardMaterial
            map={pinkStoneTex}
            color="#f2dcd5"
            roughness={0.85}
          />
        </mesh>

        {/* SIDE WALL */}
        <mesh
          position={[-10, 12, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
        >
          <boxGeometry args={[20, 24, 0.5]} />
          <meshStandardMaterial color="#e8cfc8" roughness={0.9} />
        </mesh>

        {/* DEPTH SHADOW EDGE */}
        <mesh position={[-10, 12, -10]}>
          <boxGeometry args={[0.2, 24, 0.2]} />
          <meshStandardMaterial
            color="#000"
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* ARCH CUTOUT */}
        <mesh position={[-5, 8, -9.6]}>
          <cylinderGeometry args={[4, 4, 0.8, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#f7ece8" />
        </mesh>

        {/* WINDOW */}
        <mesh position={[5, 14, -9.6]}>
          <boxGeometry args={[3, 10, 0.8]} />
          <meshStandardMaterial color="#f7ece8" />
        </mesh>

        {/* PLATFORM (REFINED HEIGHT) */}
        <mesh position={[-10, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 0.4, 18]} />
          <meshStandardMaterial
            map={pinkStoneTex}
            color="#f2dcd5"
            roughness={0.9}
          />
        </mesh>

        {/* ✨ UPGRADED STAIRS */}
        <group position={[-10, -1.1, -6]}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh
              key={i}
              position={[0, i * 0.35, i * 0.9]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[5.5, 0.25, 1.6]} />
              <meshStandardMaterial
                map={pinkStoneTex}
                color="#f2dcd5"
                roughness={0.9}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* ✨ FIXED FLOATING SPHERE */}
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh position={[-3, 5, -7]}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <meshPhysicalMaterial
            color="#f8e9e6"
            roughness={0.03}
            transmission={1}
            thickness={1.5}
            ior={1.45}
            clearcoat={1}
          />
        </mesh>
      </Float>

      {/* WATER (UNCHANGED) */}
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
        opacity={0.35}
        scale={120}
        blur={2.2}
        far={25}
        color="#5e4d4d"
      />
    </>
  );
}