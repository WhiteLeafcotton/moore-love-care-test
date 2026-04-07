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
        Math.sin(state.clock.elapsedTime * 0.08) * 2;
    }
  });

  return (
    <group ref={cloudsRef}>
      <mesh position={[-25, 30, -70]}>
        <sphereGeometry args={[22, 32, 16]} />
        <meshStandardMaterial
          color="#fcd7d7"
          transparent
          opacity={0.12}
          fog={false}
        />
      </mesh>
      <mesh position={[35, 40, -90]}>
        <sphereGeometry args={[28, 32, 16]} />
        <meshStandardMaterial
          color="#fcd7d7"
          transparent
          opacity={0.12}
          fog={false}
        />
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
    pinkStoneTex.repeat.set(2, 2);
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  }, [pinkStoneTex, waterNormals]);

  // 🔥 CAMERA (ZOOMED OUT BUT SAME FEEL)
  const views = {
    home: { pos: [28, 6, 28], look: [-10, 4, -5] }, // pulled back
    collection: { pos: [-70, 18, 60], look: [-20, 6, -10] }, // your glide preserved but wider
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
      {/* LIGHTING */}
      <Sky sunPosition={[10, 1, 20]} turbidity={0.3} rayleigh={1.8} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 20, 200]} />

      <directionalLight
        position={[10, 15, 10]}
        intensity={1.4}
        castShadow
      />

      <PinkClouds />

      {/* 🔥 CLEAN 90° CORNER (NO BACK EXTENSION) */}
      <group position={[0, -1.8, -5]} scale={0.6}>
        {/* BACK WALL */}
        <mesh position={[-10, 15, -10]} castShadow receiveShadow>
          <boxGeometry args={[20, 30, 0.6]} />
          <meshStandardMaterial
            map={pinkStoneTex}
            color="#f2dcd5"
            roughness={0.85}
          />
        </mesh>

        {/* SIDE WALL */}
        <mesh
          position={[-20, 15, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
        >
          <boxGeometry args={[20, 30, 0.6]} />
          <meshStandardMaterial
            map={pinkStoneTex}
            color="#e8cfc8"
            roughness={0.9}
          />
        </mesh>

        {/* PLATFORM (ONLY FRONT — NO EXTENSION BACK) */}
        <mesh position={[-10, 0.4, 2]} castShadow receiveShadow>
          <boxGeometry args={[18, 0.8, 12]} />
          <meshStandardMaterial
            map={pinkStoneTex}
            color="#f2dcd5"
          />
        </mesh>

        {/* CORNER SHADOW LINE */}
        <mesh position={[-20, 15, -10]}>
          <boxGeometry args={[0.2, 30, 0.2]} />
          <meshStandardMaterial
            color="#000"
            transparent
            opacity={0.08}
          />
        </mesh>
      </group>

      {/* ✨ SINGLE FLOATING GLASS SPHERE */}
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh position={[-8, 6, -6]}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshPhysicalMaterial
            color="#f8e9e6"
            roughness={0.05}
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
            sunDirection: new THREE.Vector3(10, 1, 20),
            sunColor: 0xffffff,
            waterColor: 0xa19089,
            distortionScale: 1.5,
            fog: true,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.2, 0]}
      />

      <ContactShadows
        opacity={0.3}
        scale={200}
        blur={3}
        far={40}
        color="#5e4d4d"
      />
    </>
  );
}