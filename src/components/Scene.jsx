import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* A truly "Embedded" Window Component */
const WallWindow = ({ position, wallProps }) => (
  <group position={position}>
    {/* The Sill: Built into the wall */}
    <Box args={[1.6, 12, 2.1]} position={[0, -6.5, 0]}>
      <meshStandardMaterial {...wallProps} />
    </Box>
    {/* The Header: Solid stone above the window */}
    <Box args={[1.6, 5, 2.1]} position={[0, 12.5, 0]}>
      <meshStandardMaterial {...wallProps} />
    </Box>
    {/* The Frame: Recessed slightly */}
    <Box args={[1.4, 13.2, 0.4]} position={[0, 6.1, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
    </Box>
    {/* The Glass */}
    <Box args={[1.2, 13, 0.1]} position={[0, 6.1, 0]}>
      <meshStandardMaterial color="#a0c0c0" opacity={0.3} transparent />
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
      renderTex.repeat.set(2, 4);
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.8 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.8 };

  useFrame((state, delta) => {
    // Smoother, high-end camera interpolation
    const targetPos = currentView === 'home' ? [-30, 12, 35] : [60, 5, 20];
    const targetLook = currentView === 'home' ? [5, 0, -5] : [120, 2, 15];
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.02);
    camera.lookAt(new THREE.Vector3(...targetLook));
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.05, 10]} />
      <Environment preset="dawn" />
      
      <group position={[0, 4, -10]} scale={0.8}>
        
        {/* FLOOR PLATFORM: The foundation */}
        <Box args={[35, 2, 25]} position={[2, -14, 2.5]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* BACK WALL: Multi-part construction for perfect window embedding */}
        <group position={[-15, 0, 0]}>
          <Box args={[8, 30, 2]} position={[-4, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <WallWindow position={[0.8, 0, 0]} wallProps={pinkProps} />
          <Box args={[6, 30, 2]} position={[4.6, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          <WallWindow position={[8.4, 0, 0]} wallProps={pinkProps} />
          <Box args={[14, 30, 2]} position={[18.4, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
        </group>

        {/* RIGHT WALL: Overlaps the back wall by 0.1 to hide the corner seam */}
        <group position={[10, 0, 15.1]} rotation={[0, Math.PI / 2, 0]}>
          <Box args={[12, 30, 2]} position={[-15, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[8, 12, 2]} position={[-5, 9, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[12, 30, 2]} position={[5, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
        </group>

        {/* L-BENCH: Aligned to the floor slab */}
        <group position={[-10, -11.5, -2]}>
          <Box args={[22, 1.5, 4]} position={[2, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[4, 1.5, 18]} position={[-7, 0, 9]}><meshStandardMaterial {...purpleProps} /></Box>
        </group>

      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0x999999, distortionScale: 0.4, fog: false,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
    </>
  );
}