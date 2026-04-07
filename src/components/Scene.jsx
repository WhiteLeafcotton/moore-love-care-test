import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* FULLY FRAMED SLIT WINDOW */
const SlitWindow = ({ position }) => (
  <group position={position}>
    {/* Frame perimeters using the textured stone style */}
    <Box args={[0.2, 25, 2.1]} position={[-0.4, 0, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    <Box args={[0.2, 25, 2.1]} position={[0.4, 0, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    <Box args={[1.0, 0.2, 2.1]} position={[0, 12.4, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    <Box args={[1.0, 0.2, 2.1]} position={[0, -12.4, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    {/* Glass Pane */}
    <Box args={[0.6, 24.6, 2.05]} position={[0, 0, 0]}>
      <meshStandardMaterial color="#a0c0c0" opacity={0.3} transparent />
    </Box>
  </group>
);

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // Reverting to verified working texture path to avoid white-screen 404s
  const renderTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (renderTex) {
      renderTex.wrapS = renderTex.wrapT = THREE.RepeatWrapping;
      renderTex.repeat.set(2, 4); // Tiling for the textured render look
    }
  }, [renderTex]);

  // Master material presets for the entire structure
  const pinkProps = { map: renderTex, color: "#fcd7d7", roughness: 0.8 };
  const purpleProps = { map: renderTex, color: "#d1c4e9", roughness: 0.8 };

  const views = {
    home: { pos: [-20, 5, 25], look: [15, 2, -10] },      
    collection: { pos: [60, 3, 15], look: [120, 2, 15] } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.015); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.015);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.3;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      
      <group position={[0, 4, -10]} scale={0.8}>
        
        {/* --- BACK WALL (Pink) - Seamless Corner Fix --- */}
        <group position={[-15.5, 0, 0]}>
            <Box args={[11, 30, 2]} position={[-0.5, 0, 0]}> 
              <meshStandardMaterial {...pinkProps} />
            </Box>
            <SlitWindow position={[5.5, 0, 0]} />
            <Box args={[18, 30, 2]} position={[15.5, 0, 0]}>
              <meshStandardMaterial {...pinkProps} />
            </Box>
            <SlitWindow position={[25.5, 0, 0]} />
            <Box args={[10, 30, 2]} position={[35.5, 0, 0]}>
              <meshStandardMaterial {...pinkProps} />
            </Box>
        </group>

        {/* --- RIGHT WALL (Purple) - Overlapping for no gaps --- */}
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

        {/* THE PLATFORM (Tucked into corner foundation) */}
        <Box args={[25, 1.5, 20]} position={[-10, -14.2, 5]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* THE L-BENCH */}
        <group position={[-10, -12, 0]}>
          <Box args={[20, 2, 4]} position={[0, 0, -6]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
          <Box args={[4, 2, 16]} position={[-8, 0, 4]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
        </group>

      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.5, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
    </>
  );
}