import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box, Cylinder } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* A structural Arched Header that sits BETWEEN pillars to create a void */
const ArchedHeader = ({ position, colorProps, width = 3, height = 3 }) => (
  <group position={position}>
    {/* The Square block above the arch */}
    <Box args={[width, height, 2.01]} position={[0, height / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
    {/* The Arched Cutout (the rounded underside) */}
    <Cylinder 
      args={[width / 2, width / 2, 2.01, 32, 1, false, 0, Math.PI]} 
      position={[0, 0, 0]} 
      rotation={[0, 0, Math.PI]}
    >
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
    const targetPos = currentView === 'home' ? [-18, 8, 25] : [35, 6, 18];
    const targetLook = currentView === 'home' ? [2, 0, -5] : [70, 0, 10];
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
        <Box args={[36, 1.5, 28]} position={[2.5, -8.7, 7]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* PINK WALL: Built using vertical segments to create real voids */}
        <group position={[-12, 0, 0]}>
          {/* Vertical Pillars */}
          <Box args={[3, 16, 2]} position={[-1.5, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box> 
          <Box args={[1.5, 16, 2]} position={[2.75, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[1.5, 16, 2]} position={[6.75, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[1.5, 16, 2]} position={[10.75, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          
          {/* Arched Tops for Doorways */}
          <ArchedHeader position={[0.6, 1, 0]} width={2.8} height={7} colorProps={pinkProps} />
          <ArchedHeader position={[4.75, 1, 0]} width={2.5} height={7} colorProps={pinkProps} />
          <ArchedHeader position={[8.75, 1, 0]} width={2.5} height={7} colorProps={pinkProps} />

          {/* Right side mass to hit the corner joint */}
          <Box args={[17, 16, 2]} position={[20, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
        </group>

        {/* PURPLE WALL: Snapped to Pink Wall edge at 90° */}
        <group position={[16.5, 0, 1]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Window Pillars */}
          <Box args={[6, 16, 2]} position={[3, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[2, 16, 2]} position={[10, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[10, 16, 2]} position={[20, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>

          {/* Elevated Arched Windows */}
          <ArchedHeader position={[7.5, 4, 0]} width={3} height={4} colorProps={purpleProps} />
          <ArchedHeader position={[14.5, 4, 0]} width={3} height={4} colorProps={purpleProps} />
          
          {/* Sills (Bottom of windows) */}
          <Box args={[3, 5.5, 2]} position={[7.5, -5.25, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[3, 5.5, 2]} position={[14.5, -5.25, 0]}><meshStandardMaterial {...purpleProps} /></Box>
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