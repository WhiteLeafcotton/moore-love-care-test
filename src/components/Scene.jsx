import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box, Cylinder } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* A structural Archway component */
const ArchwayOpening = ({ position, colorProps, width = 3, height = 6 }) => (
  <group position={position}>
    {/* Side Pillars */}
    <Box args={[width, height, 2.05]} position={[0, height / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
    {/* The Arched Top */}
    <Cylinder args={[width / 2, width / 2, 2.05, 32]} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
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
      renderTex.repeat.set(1, 2);
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.9 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.9 };

  useFrame((state, delta) => {
    const targetPos = currentView === 'home' ? [-18, 6, 22] : [35, 4, 12];
    const targetLook = currentView === 'home' ? [2, 0, -5] : [70, 0, 8];
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.02);
    camera.lookAt(new THREE.Vector3(...targetLook));
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.05, 10]} />
      <Environment preset="dawn" />
      
      <group position={[0, 2, -10]} scale={0.85}>
        
        {/* FLOOR PLATFORM */}
        <Box args={[30, 1.2, 22]} position={[0, -6.6, 4]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* PINK WALL (Back): Clustered Arched Doorways on the Left */}
        <group position={[-14, 0, 0]}>
          {/* Main Wall Mass */}
          <Box args={[28, 12, 2]} position={[14, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          
          {/* Arched Voids (clustered left) */}
          <ArchwayOpening position={[4, -6, 0]} colorProps={pinkProps} width={2.5} height={5} />
          <ArchwayOpening position={[8, -6, 0]} colorProps={pinkProps} width={2.5} height={5} />
          <ArchwayOpening position={[12, -6, 0]} colorProps={pinkProps} width={2.5} height={5} />
        </group>

        {/* PURPLE WALL (Right): Matching Arched Windows */}
        <group position={[14, 0, 11]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Main Wall Mass */}
          <Box args={[22, 12, 2]} position={[11, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          
          {/* Arched Windows (placed with door logic) */}
          <ArchwayOpening position={[6, -2, 0]} colorProps={purpleProps} width={2.2} height={4} />
          <ArchwayOpening position={[10, -2, 0]} colorProps={purpleProps} width={2.2} height={4} />
        </group>

      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1500, 1500), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0x999999, distortionScale: 0.25, fog: false,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
    </>
  );
}