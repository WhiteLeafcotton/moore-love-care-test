import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box, Cylinder } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* Simplified Arch: Guaranteed to reach the floor */
const WallWithArch = ({ position, colorProps, width = 4, height = 16, archW = 3, archH = 8, isWindow = false }) => (
  <group position={position}>
    {/* Left Pillar */}
    <Box args={[(width - archW) / 2, height, 2]} position={[-(archW + (width - archW) / 2) / 2, height / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
    {/* Right Pillar */}
    <Box args={[(width - archW) / 2, height, 2]} position={[(archW + (width - archW) / 2) / 2, height / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
    {/* Header (Top of wall) */}
    <Box args={[archW, height - archH - (isWindow ? 4 : 0), 2]} position={[0, height - (height - archH - (isWindow ? 4 : 0)) / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
    {/* The Arch Cap */}
    <Cylinder args={[archW / 2, archW / 2, 2, 32, 1, false, 0, Math.PI]} position={[0, archH + (isWindow ? 4 : 0), 0]} rotation={[0, 0, Math.PI]}>
      <meshStandardMaterial {...colorProps} />
    </Cylinder>
    {/* Sill for windows only */}
    {isWindow && (
      <Box args={[archW, 4, 2]} position={[0, 2, 0]}>
        <meshStandardMaterial {...colorProps} />
      </Box>
    )}
  </group>
);

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  const renderTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (renderTex) {
      renderTex.wrapS = renderTex.wrapT = THREE.RepeatWrapping;
      renderTex.repeat.set(1, 2);
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.9 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.9 };

  useFrame((state, delta) => {
    const targetPos = currentView === 'home' ? [-18, 7, 24] : [32, 5, 18];
    const targetLook = currentView === 'home' ? [2, 0, -5] : [65, 0, 10];
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.02);
    camera.lookAt(new THREE.Vector3(...targetLook));
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-40, 0.1, 10]} />
      <Environment preset="dawn" />
      
      <group position={[0, 2, -5]} scale={0.9}>
        {/* FLOOR PLATFORM */}
        <Box args={[38, 1.5, 28]} position={[3, -8.7, 7]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* PINK BACK WALL */}
        <group position={[-14, -8, 0]}>
          <Box args={[4, 16, 2]} position={[2, 8, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <WallWithArch position={[6, 0, 0]} width={4} archW={2.5} archH={8} colorProps={pinkProps} />
          <WallWithArch position={[10, 0, 0]} width={4} archW={2.5} archH={8} colorProps={pinkProps} />
          <WallWithArch position={[14, 0, 0]} width={4} archW={2.5} archH={8} colorProps={pinkProps} />
          {/* Extension to the corner */}
          <Box args={[14, 16, 2]} position={[23, 8, 0]}><meshStandardMaterial {...pinkProps} /></Box>
        </group>

        {/* PURPLE SIDE WALL: Rotated 90° and snapped to corner */}
        <group position={[16, -8, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <Box args={[6, 16, 2]} position={[3, 8, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <WallWithArch position={[9, 0, 0]} width={6} archW={3} archH={5} isWindow={true} colorProps={purpleProps} />
          <WallWithArch position={[15, 0, 0]} width={6} archW={3} archH={5} isWindow={true} colorProps={purpleProps} />
          <Box args={[8, 16, 2]} position={[22, 8, 0]}><meshStandardMaterial {...purpleProps} /></Box>
        </group>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1200, 1200), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0x999999, distortionScale: 0.2, fog: false,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
    </>
  );
}