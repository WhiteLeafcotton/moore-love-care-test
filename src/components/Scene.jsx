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
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <boxGeometry args={[22, 0.6, 20]} />
          <meshStandardMaterial color="#f2dcd5" />
        </mesh>

        {/* INTEGRATED STAIRS */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[-2, i * 0.6, -4 + i * 1.2]} castShadow>
            <boxGeometry args={[8, 0.5, 2]} />
            <meshStandardMaterial color="#f2dcd5" />
          </mesh>
        ))}
      </group>

      {/* FLOATING SPHERE */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={1}>
        <mesh position={[6, 6, -6]}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshPhysicalMaterial
            color="#f6e3df"
            roughness={0}
            transmission={0.9}
            thickness={1}
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