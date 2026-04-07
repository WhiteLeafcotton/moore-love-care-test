import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box, Cylinder } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* Structural Arch Header (The "Cap" between pillars) */
const ArchHeader = ({ position, colorProps, width = 3, height = 2 }) => (
  <group position={position}>
    {/* The Square Header Block */}
    <Box args={[width, height, 2]} position={[0, height / 2, 0]}>
      <meshStandardMaterial {...colorProps} />
    </Box>
    {/* The Rounded Under-Arch (Subtractive Logic) */}
    <Cylinder 
      args={[width / 2, width / 2, 2.05, 32, 1, false, 0, Math.PI]} 
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
      renderTex.repeat.set(1, 2);
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.9 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.9 };

  useFrame((state, delta) => {
    const targetPos = currentView === 'home' ? [-15, 7, 22] : [32, 5, 15];
    const targetLook = currentView === 'home' ? [5, 0, -5] : [65, 0, 10];
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
        <Box args={[34, 1.5, 26]} position={[2, -8.7, 6]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* PINK WALL (Back): 3 Small Doorways clustered left */}
        <group position={[-12, 0, 0]}>
          {/* Pillars */}
          <Box args={[3, 16, 2]} position={[-1.5, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[1.5, 16, 2]} position={[3.25, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[1.5, 16, 2]} position={[7.25, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <Box args={[1.5, 16, 2]} position={[11.25, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          
          {/* Arched Caps (The Door Tops) */}
          <ArchHeader position={[1, 1, 0]} width={2.5} height={7} colorProps={pinkProps} />
          <ArchHeader position={[5.25, 1, 0]} width={2.5} height={7} colorProps={pinkProps} />
          <ArchHeader position={[9.25, 1, 0]} width={2.5} height={7} colorProps={pinkProps} />

          {/* Right Solid Section leading to corner */}
          <Box args={[16, 16, 2]} position={[20, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
        </group>

        {/* PURPLE WALL (Right): 2 Small Windows at 90 degrees */}
        <group position={[16, 0, 1]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Pillars */}
          <Box args={[6, 16, 2]} position={[3, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[2, 16, 2]} position={[9, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[8, 16, 2]} position={[18, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>

          {/* Arched Caps (The Window Tops - Elevated) */}
          <ArchHeader position={[7, 3, 0]} width={2} height={5} colorProps={purpleProps} />
          <ArchHeader position={[13, 3, 0]} width={2} height={5} colorProps={purpleProps} />
          
          {/* Sills (Bottom of windows) */}
          <Box args={[2, 5, 2]} position={[7, -5.5, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[2, 5, 2]} position={[13, -5.5, 0]}><meshStandardMaterial {...purpleProps} /></Box>
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