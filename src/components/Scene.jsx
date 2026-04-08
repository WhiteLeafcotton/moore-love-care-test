import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* Modular Wall Segment: Creates a clean rectangular opening */
const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 15, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]}>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh position={[0, 2, 0]}>
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
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1); }
    });
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.8 };
  const purpleProps = { map: travertineTex, color: "#d1c4e9", roughness: 0.8 };

  useFrame((state, delta) => {
    const targetPos = currentView === 'home' ? [-25, 6, 35] : [35, 5, 20];
    const targetLook = currentView === 'home' ? [5, 0, -5] : [70, 0, 5];
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.025);
    camera.lookAt(new THREE.Vector3(...targetLook));
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} />
      <Environment preset="dawn" />
      
      <group position={[0, 0, 0]}>
        {/* PLATFORM: Height increased to 5.0 and Y offset adjusted to -1.5 */}
        <mesh receiveShadow position={[12, -1.5, 15]}>
          <boxGeometry args={[9, 5.0, 28]} />
          <meshStandardMaterial map={travertineTex} color="#f1dfd8" />
        </mesh>

        {/* FRONT PINK WALL - POSITION LOCKED */}
        <group position={[-16, 0, 0]}>
          <mesh position={[1, 7.5, 0]}>
            <boxGeometry args={[4, 15, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
          <WallOpening position={[6, 0, 0]} width={6} openingW={3.5} openingH={9} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} width={6} openingW={3.5} openingH={9} colorProps={pinkProps} />
          <mesh position={[24, 7.5, 0]}>
            <boxGeometry args={[18, 15, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
        </group>

        {/* SIDE PURPLE WALL - POSITION LOCKED */}
        <group position={[17, 0, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[4, 7.5, 0]}>
            <boxGeometry args={[8, 15, 2]} />
            <meshStandardMaterial {...purpleProps} />
          </mesh>
          <WallOpening position={[11, 0, 0]} width={6} openingW={4} openingH={6} isWindow={true} colorProps={purpleProps} />
          <WallOpening position={[17, 0, 0]} width={6} openingW={4} openingH={6} isWindow={true} colorProps={purpleProps} />
          <mesh position={[24, 7.5, 0]}>
            <boxGeometry args={[8, 15, 2]} />
            <meshStandardMaterial {...purpleProps} />
          </mesh>
        </group>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.4,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      />
    </>
  );
}