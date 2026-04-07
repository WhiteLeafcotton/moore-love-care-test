import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach((t) => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 16;
      }
    });
    travertineTex.repeat.set(1.5, 10);
    pinkStoneTex.repeat.set(1.5, 10);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  /* CAMERA — balanced architectural view */
  const views = {
    home: { pos: [18, 4, 38], look: [0, 8, 0] },
    collection: { pos: [-90, 6, 50], look: [-40, 10, 0] }
  };

  const targetLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const target = views[currentView];

    camera.fov = THREE.MathUtils.lerp(camera.fov, 45, 0.02);
    camera.updateProjectionMatrix();

    camera.position.lerp(new THREE.Vector3(...target.pos), 0.02);
    targetLook.lerp(new THREE.Vector3(...target.look), 0.02);
    camera.lookAt(targetLook);

    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.1;
    }
  });

  /* FUNCTION — BUILDS A CLEAN ARCH (box + half cylinder) */
  const Arch = ({ width = 8, height = 16, depth = 0.3, material, y = 0 }) => {
    const radius = width / 2;
    const rectHeight = height - radius;

    return (
      <group position={[0, y, 0]}>
        {/* vertical body */}
        <mesh position={[0, rectHeight / 2, 0]}>
          <boxGeometry args={[width, rectHeight, depth]} />
          {material}
        </mesh>

        {/* arch top */}
        <mesh position={[0, rectHeight, 0]}>
          <cylinderGeometry args={[radius, radius, depth, 48, 1, false, 0, Math.PI]} />
          {material}
        </mesh>
      </group>
    );
  };

  const travMaterial = (
    <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.55} />
  );

  const pinkMaterial = (
    <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.55} />
  );

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={2} rayleigh={2} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#f7ece8", 20, 150]} />

      {/* ================= STRUCTURE ================= */}
      <group position={[0, 0, -12]} scale={0.85}>

        {/* BACK WALL */}
        <group position={[-30, 0, 0]}>
          <mesh position={[0, 20, 0]}>
            <boxGeometry args={[40, 40, 0.3]} />
            {travMaterial}
          </mesh>

          {/* centered arch opening */}
          <group position={[6, 0, 0.2]}>
            <Arch width={10} height={18} depth={0.35} material={travMaterial} />
          </group>
        </group>

        {/* CENTER WALL */}
        <mesh position={[-5, 20, 0]}>
          <boxGeometry args={[20, 40, 0.3]} />
          {travMaterial}
        </mesh>

        {/* MAIN FEATURE ARCH */}
        <group position={[12, 0, 0.2]}>
          <Arch width={12} height={20} depth={0.35} material={travMaterial} />
        </group>

        {/* RIGHT MASS WALL */}
        <mesh position={[28, 20, 0]}>
          <boxGeometry args={[26, 40, 0.3]} />
          {travMaterial}
        </mesh>

        {/* SIDE WALL WITH DOUBLE ARCHES */}
        <group position={[-36, 0, 25]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 20, 0]}>
            <boxGeometry args={[60, 40, 0.3]} />
            {pinkMaterial}
          </mesh>

          <group position={[-12, 0, 0.2]}>
            <Arch width={10} height={18} depth={0.35} material={pinkMaterial} />
          </group>

          <group position={[12, 0, 0.2]}>
            <Arch width={10} height={18} depth={0.35} material={pinkMaterial} />
          </group>
        </group>

        {/* BENCH */}
        <mesh position={[0, -13, -5]}>
          <boxGeometry args={[50, 4, 12]} />
          {travMaterial}
        </mesh>
      </group>

      {/* WATER */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(5000, 5000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(10, 1, 20),
            sunColor: 0xffffff,
            waterColor: 0xa19089,
            distortionScale: 0.6,
            fog: true
          }
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />

      <ContactShadows opacity={0.25} scale={250} blur={4} far={60} color="#5e4d4d" />
    </>
  );
}