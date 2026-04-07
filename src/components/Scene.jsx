import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* My Design Method: The "Shadow-Gap" Window */
const ArchitecturalWindow = ({ args, position }) => (
  <group position={position}>
    <Box args={args}>
      <meshStandardMaterial color="#a0c0c0" opacity={0.2} transparent roughness={0} metalness={1} />
    </Box>
    {/* Minimalist Black Linear Frame */}
    <Box args={[args[0] + 0.2, 0.1, args[2] + 0.2]} position={[0, args[1]/2, 0]}>
      <meshStandardMaterial color="#000" />
    </Box>
    <Box args={[args[0] + 0.2, 0.1, args[2] + 0.2]} position={[0, -args[1]/2, 0]}>
      <meshStandardMaterial color="#000" />
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
      renderTex.repeat.set(1.5, 3);
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.9 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.9 };

  useFrame((state, delta) => {
    const targetPos = currentView === 'home' ? [-35, 15, 40] : [50, 10, 20];
    const targetLook = currentView === 'home' ? [0, 0, 0] : [100, 0, 10];
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.02);
    camera.lookAt(new THREE.Vector3(...targetLook));
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-50, 2, 10]} />
      <Environment preset="dawn" />
      
      <group position={[0, 0, 0]}>
        
        {/* STEPPED MONOLITHIC FLOOR */}
        <Box args={[40, 3, 30]} position={[0, -14, 0]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* THE "FLOATING" WALL SYSTEM */}
        <group position={[0, -12.2, 0]}> {/* The 0.2 Shadow Gap */}
          
          {/* WALL A: Back Pink Wall with Asymmetric Opening */}
          <group position={[-18, 14, 0]}>
            <Box args={[12, 28, 2]} position={[0, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
            <ArchitecturalWindow args={[8, 28, 0.5]} position={[10, 0, 0]} />
            <Box args={[16, 28, 2]} position={[22, 0, 0]}><meshStandardMaterial {...pinkProps} /></Box>
          </group>

          {/* WALL B: Side Purple Wall with Floor-Level Panoramic */}
          <group position={[18, 14, 14]} rotation={[0, -Math.PI / 2, 0]}>
            <Box args={[10, 28, 2]} position={[0, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
            {/* Massive Panoramic Opening */}
            <group position={[11, 0, 0]}>
                <Box args={[12, 10, 2]} position={[0, 9, 0]}><meshStandardMaterial {...purpleProps} /></Box>
                <ArchitecturalWindow args={[12, 18, 0.5]} position={[0, -5, 0]} />
            </group>
            <Box args={[6, 28, 2]} position={[20, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          </group>

        </group>

        {/* MINIMALIST L-BENCH */}
        <group position={[-12, -12.5, -4]}>
          <Box args={[24, 1.2, 5]} position={[4, 0, 0]}><meshStandardMaterial {...purpleProps} /></Box>
          <Box args={[5, 1.2, 20]} position={[-5.5, 0, 7.5]}><meshStandardMaterial {...purpleProps} /></Box>
        </group>

      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0x777777, distortionScale: 0.3, fog: false,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
    </>
  );
}