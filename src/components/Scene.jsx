import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* FULLY FRAMED SLIT WINDOW with that exact black stone texture material */
const SlitWindow = ({ position }) => (
  <group position={position}>
    {/* Left Frame Vertical */}
    <Box args={[0.2, 25, 2.1]} position={[-0.4, 0, 0]}>
      <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0} /> {/* Textured Black Stone look */}
    </Box>
    {/* Right Frame Vertical */}
    <Box args={[0.2, 25, 2.1]} position={[0.4, 0, 0]}>
      <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0} />
    </Box>
    {/* Top Frame Horizontal */}
    <Box args={[1.0, 0.2, 2.1]} position={[0, 12.4, 0]}>
      <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0} />
    </Box>
    {/* Bottom Frame Horizontal */}
    <Box args={[1.0, 0.2, 2.1]} position={[0, -12.4, 0]}>
      <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0} />
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

  // Use only ONE main stucco/lime wash texture for the entire structure
  const renderTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/lime_wash_texture.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (renderTex) {
      renderTex.wrapS = renderTex.wrapT = THREE.RepeatWrapping;
      renderTex.anisotropy = 16;
      renderTex.repeat.set(2, 6); // Tighten tiling for intimate feel
    }
  }, [renderTex]);

  // Define the material properties with the texture (replaces the old travertine/stone)
  const pinkRenderProps = { map: renderTex, color: "#fcd7d7", roughness: 0.7, metalness: 0 };
  const purpleRenderProps = { map: renderTex, color: "#d1c4e9", roughness: 0.7, metalness: 0 }; // A light purple render

  /* Optimized "Pool Room" Views (Closer for detail) */
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
      <fog attach="fog" args={["#f7ece8", 20, 150]} />
      
      {/* THE INTIMATE TEXTURED POOL SANCTUARY */}
      <group position={[0, 4, -10]} scale={0.8}>
        
        {/* --- BACK WALL (Now Pink Textured Render) with FRAMED SLITS --- */}
        <group position={[-15, 0, 0]}>
            {/* Extended Solid Section to close the corner gap completely */}
            <Box args={[12, 30, 2]} position={[-1, 0, 0]}> 
              <meshStandardMaterial {...pinkRenderProps} />
            </Box>
            
            <SlitWindow position={[6.1, 0, 0]} />

            <Box args={[18, 30, 2]} position={[16.1, 0, 0]}>
              <meshStandardMaterial {...pinkRenderProps} />
            </Box>

            <SlitWindow position={[26.1, 0, 0]}> <Box args={[0.2, 25, 2.1]}> <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0} /> </Box> </SlitWindow>

            <Box args={[10, 30, 2]} position={[36.1, 0, 0]}>
              <meshStandardMaterial {...pinkRenderProps} />
            </Box>
        </group>

        {/* --- RIGHT WALL (Now Purple Textured Render) - Doors intact --- */}
        <group position={[10, 0, 15]} rotation={[0, Math.PI / 2, 0]}>
          <Box args={[10, 30, 2]} position={[-15, 0, 0]}>
            <meshStandardMaterial {...purpleRenderProps} />
          </Box>
          <Box args={[10, 10, 2]} position={[-5, 10, 0]}>
            <meshStandardMaterial {...purpleRenderProps} />
          </Box>
          <Box args={[10, 30, 2]} position={[5, 0, 0]}>
            <meshStandardMaterial {...purpleRenderProps} />
          </Box>
        </group>

        {/* --- FIXED CONNECTIONS & FOUNDATION --- */}
        
        {/* CORNER CONNECTOR - Ensures no gap */}
        <Box args={[3, 30, 2]} position={[-15.5, 0, 1]} rotation={[0, Math.PI / 4, 0]}>
          <meshStandardMaterial {...pinkRenderProps} />
        </Box>

        {/* NEW ADDITION: CORNER PLATFORM */}
        <Box args={[22, 1.5, 20]} position={[-10, -14.2, 5]}>
          <meshStandardMaterial {...pinkRenderProps} />
        </Box>

        {/* L-SHAPED CORNER BENCH */}
        <group position={[-10, -12, 0]}>
          <Box args={[20, 2, 4]} position={[0, 0, -6]}>
            <meshStandardMaterial {...purpleRenderProps} />
          </Box>
          <Box args={[4, 2, 16]} position={[-8, 0, 4]}>
            <meshStandardMaterial {...purpleRenderProps} />
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
      <ContactShadows opacity={0.4} scale={150} blur={2.5} far={40} color="#5e4d4d" />
    </>
  );
}