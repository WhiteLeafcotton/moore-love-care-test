import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box, Cylinder } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* A structural Arch Cutout component */
const ArchVoid = ({ position, colorProps, width = 3, height = 7 }) => (
  <group position={position}>
    {/* Side Pillars */}
    <Box args={[width, height, 2.01]} position={[0, height / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
    {/* The Arch Top */}
    <Cylinder args={[width / 2, width / 2, 2.01, 32]} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Cylinder>
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
      renderTex.repeat.set(1.5, 2.5);
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.9 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.9 };

  useFrame((state, delta) => {
    // Adjusted camera for better "corner room" perspective
    const targetPos = currentView === 'home' ? [-15, 7, 20] : [30, 5, 15];
    const targetLook = currentView === 'home' ? [5, 0, -5] : [60, 0, 10];
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
        <Box args={[32, 1.5, 24]} position={[2, -8.7, 5]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* BACK PINK WALL: Built in segments to create TRUE cutouts */}
        <group position={[-12, 0, 0]}>
          {/* Main Wall Fillers around the doors */}
          <Box args={[4, 16, 2]} position={[-2, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <ArchVoid position={[2, -8, 0]} colorProps={pinkProps} width={3.5} height={7} />
          <Box args={[2, 16, 2]} position={[4.75, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <ArchVoid position={[7.5, -8, 0]} colorProps={pinkProps} width={3.5} height={7} />
          <Box args={[2, 16, 2]} position={[10.25, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <ArchVoid position={[13, -8, 0]} colorProps={pinkProps} width={3.5} height={7} />
          {/* Long right side of pink wall to lead into corner */}
          <Box args={[14, 16, 2]} position={[21.75, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
        </group>

        {/* PURPLE SIDE WALL: Anchored at exact 90 degrees to pink wall's end */}
        <group position={[15.75, 0, 1]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Wall sections for proportional windows */}
          <Box args={[6, 16, 2]} position={[3, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <ArchVoid position={[7.5, -3, 0]} colorProps={purpleProps} width={2.5} height={5} />
          <Box args={[4, 16, 2]} position={[10.75, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <ArchVoid position={[14, -3, 0]} colorProps={purpleProps} width={2.5} height={5} />
          <Box args={[8, 16, 2]} position={[20, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
        </group>

      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
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