import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* EMBEDDED WINDOW UNIT */
const EmbeddedWindow = ({ position }) => (
  <group position={position}>
    {/* Frame recessed into the wall */}
    <Box args={[1.4, 0.2, 2.1]} position={[0, 12.4, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    <Box args={[1.4, 12.4, 2.1]} position={[0, -6.3, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    {/* Glass pane embedded within the frame */}
    <Box args={[1.2, 12.2, 0.1]} position={[0, 6.2, 0]}>
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
      renderTex.repeat.set(2, 4);
    }
  }, [renderTex]);

  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.8 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.8 };

  const views = {
    home: { pos: [-25, 8, 30], look: [10, 0, -5] },      
    collection: { pos: [60, 5, 20], look: [120, 2, 15] } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.02); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.02);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.05, 10]} />
      <Environment preset="dawn" />
      
      <group position={[0, 4, -10]} scale={0.8}>
        
        {/* --- BACK WALL (Pink) - Multi-Segment for Embedded Look --- */}
        <group position={[-15.5, 0, 0]}>
            {/* Solid Start */}
            <Box args={[6, 30, 2]} position={[-3, 0, 0]}> 
              <meshStandardMaterial {...pinkProps} />
            </Box>
            
            <EmbeddedWindow position={[0.7, 0, 0]} />

            {/* Middle Pier (Narrowed) */}
            <Box args={[8, 30, 2]} position={[5.4, 0, 0]}> 
              <meshStandardMaterial {...pinkProps} />
            </Box>

            <EmbeddedWindow position={[10.1, 0, 0]} />

            {/* Solid End */}
            <Box args={[15, 30, 2]} position={[21.6, 0, 0]}>
              <meshStandardMaterial {...pinkProps} />
            </Box>
        </group>

        {/* --- RIGHT WALL (Purple) - Overlapping for Seamless Corner --- */}
        <group position={[10, 0, 15.5]} rotation={[0, Math.PI / 2, 0]}>
          <Box args={[11, 30, 2]} position={[-15.5, 0, 0]}> 
            <meshStandardMaterial {...purpleProps} />
          </Box>
          <Box args={[10, 10, 2]} position={[-5, 10, 0]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
          <Box args={[10, 30, 2]} position={[5, 0, 0]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
        </group>

        {/* --- PLATFORM FLOOR - The bottom of the 'cube' --- */}
        <Box args={[32, 1.5, 25]} position={[0.5, -14.2, 3]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* THE L-BENCH */}
        <group position={[-10, -12, 0]}>
          <Box args={[22, 2, 4]} position={[1, 0, -6]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
          <Box args={[4, 2, 18]} position={[-8, 0, 5]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
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