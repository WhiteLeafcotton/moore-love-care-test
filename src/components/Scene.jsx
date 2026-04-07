import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* Scaled-down Embedded Slider Window */
const SliderWindow = ({ position, wallProps }) => (
  <group position={position}>
    {/* Header & Sill to "embed" the window */}
    <Box args={[1.6, 2, 2.1]} position={[0, 4, 0]}><meshStandardMaterial {...wallProps} /></Box>
    <Box args={[1.6, 6, 2.1]} position={[0, -5, 0]}><meshStandardMaterial {...wallProps} /></Box>
    {/* The Frame and Glass */}
    <Box args={[1.4, 6.2, 0.4]} position={[0, -0.1, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    <Box args={[1.2, 6, 0.1]} position={[0, -0.1, 0]}>
      <meshStandardMaterial color="#a0c0c0" opacity={0.4} transparent />
    </Box>
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
      renderTex.repeat.set(1, 2.5); // Scaled for smaller walls
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.9 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.9 };

  useFrame((state, delta) => {
    const targetPos = currentView === 'home' ? [-20, 8, 25] : [40, 5, 15];
    const targetLook = currentView === 'home' ? [0, 0, -5] : [80, 0, 10];
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.02);
    camera.lookAt(new THREE.Vector3(...targetLook));
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.05, 10]} />
      <Environment preset="dawn" />
      
      <group position={[0, 4, -10]} scale={0.9}>
        
        {/* 1. FLOOR PLATFORM */}
        <Box args={[28, 1.5, 22]} position={[2, -8.7, 4]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* 2. PINK WALL: 3 Doorways */}
        <group position={[-10, 0, 0]}>
          <Box args={[4, 16, 2]} position={[-2, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          {/* Door 1 */}
          <Box args={[4, 4, 2]} position={[2, 6, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[4, 16, 2]} position={[6, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          {/* Door 2 */}
          <Box args={[4, 4, 2]} position={[10, 6, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[4, 16, 2]} position={[14, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          {/* Door 3 */}
          <Box args={[4, 4, 2]} position={[18, 6, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[6, 16, 2]} position={[23, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
        </group>

        {/* 3. PURPLE WALL: 90° Corner meeting & 2 Slider Windows */}
        <group position={[14.1, 0, 11]} rotation={[0, -Math.PI / 2, 0]}>
          <Box args={[8, 16, 2]} position={[-4, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <SliderWindow position={[0.8, 0, 0]} wallProps={purpleProps} />
          <Box args={[4, 16, 2]} position={[3.6, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <SliderWindow position={[6.4, 0, 0]} wallProps={purpleProps} />
          <Box args={[6, 16, 2]} position={[12.4, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
        </group>

      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0x999999, distortionScale: 0.3, fog: false,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
    </>
  );
}