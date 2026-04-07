import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box, Cylinder } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* A structural "Void" Maker: Pillars + Arch Cap */
const ArchOpening = ({ position, colorProps, width = 4, height = 8 }) => (
  <group position={position}>
    <Box args={[width, height, 2.01]} position={[0, height / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
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
    const targetPos = currentView === 'home' ? [-15, 6, 22] : [35, 4, 12];
    const targetLook = currentView === 'home' ? [5, 0, -5] : [70, 0, 8];
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.02);
    camera.lookAt(new THREE.Vector3(...targetLook));
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.05, 10]} />
      <Environment preset="dawn" />
      
      <group position={[0, 2, -10]} scale={0.9}>
        
        {/* FLOOR PLATFORM */}
        <Box args={[32, 1.5, 24]} position={[2, -8.7, 5]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* PINK BACK WALL: Pillars & Arched Doors clustered left */}
        <group position={[-12, 0, 0]}>
          {/* Left Anchor Pillar */}
          <Box args={[4, 16, 2]} position={[-2, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          
          {/* Three Arched Doorways (The "Voids") */}
          <group position={[2.5, -8, 0]}>
            <ArchOpening position={[0, 0, 0]} colorProps={pinkProps} width={1} height={9} />
            <ArchOpening position={[4, 0, 0]} colorProps={pinkProps} width={1} height={9} />
            <ArchOpening position={[8, 0, 0]} colorProps={pinkProps} width={1} height={9} />
            {/* The lintels (caps) above doors */}
            <Box args={[12, 7, 2]} position={[4, 4.5, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          </group>

          {/* Right Wall Mass leading to corner */}
          <Box args={[14, 16, 2]} position={[21, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
        </group>

        {/* PURPLE SIDE WALL: Locked to 90 degrees */}
        <group position={[16, 0, 1]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Start Pillar */}
          <Box args={[6, 16, 2]} position={[3, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          
          {/* Two Arched Windows (Elevated "Voids") */}
          <group position={[9, -2, 0]}>
             <ArchOpening position={[0, -4, 0]} colorProps={purpleProps} width={1} height={4} />
             <ArchOpening position={[4, -4, 0]} colorProps={purpleProps} width={1} height={4} />
             {/* Window surround mass */}
             <Box args={[8, 12, 2]} position={[2, 2, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          </group>

          {/* End Pillar */}
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