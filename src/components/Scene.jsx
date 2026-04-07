import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* FULLY CONNECTED EMBEDDED WINDOW */
const EmbeddedWindow = ({ position, wallProps }) => (
  <group position={position}>
    {/* Top Frame (Intersecting the wall for a perfect seal) */}
    <Box args={[1.5, 0.4, 2.2]} position={[0, 12.4, 0]}>
      <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
    </Box>
    {/* Bottom Sill matching wall texture, positioned to be gapless */}
    <Box args={[1.5, 12.4, 2.1]} position={[0, -6.3, 0]}>
      <meshStandardMaterial {...wallProps} />
    </Box>
    {/* Glass pane recessed with volume to prevent flickering */}
    <Box args={[1.3, 12.2, 0.5]} position={[0, 6.2, 0]}>
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
    home: { pos: [-32, 12, 35], look: [5, 0, -8] },      
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
        
        {/* --- BACK WALL (Pink) - Gapless Segmenting --- */}
        <group position={[-15.5, 0, 0]}>
            {/* Left anchor block */}
            <Box args={[8, 30, 2]} position={[-4, 0, 0]}> 
              <meshStandardMaterial {...pinkProps} />
            </Box>
            
            {/* Embedded Window 1 (Tight overlap) */}
            <EmbeddedWindow position={[0.7, 0, 0]} wallProps={pinkProps} />

            {/* Middle Pier - Recalculated for closer window placement */}
            <Box args={[10, 30, 2]} position={[6.4, 0, 0]}> 
              <meshStandardMaterial {...pinkProps} />
            </Box>

            {/* Embedded Window 2 */}
            <EmbeddedWindow position={[12.1, 0, 0]} wallProps={pinkProps} />

            {/* Right anchor block */}
            <Box args={[12, 30, 2]} position={[23.1, 0, 0]}>
              <meshStandardMaterial {...pinkProps} />
            </Box>
        </group>

        {/* --- RIGHT WALL (Purple) - Forced Corner Overlap --- */}
        <group position={[10, 0, 15.5]} rotation={[0, Math.PI / 2, 0]}>
          {/* Extended corner block to ensure walls physically intersect */}
          <Box args={[11, 30, 2.1]} position={[-15.5, 0, 0]}> 
            <meshStandardMaterial {...purpleProps} />
          </Box>
          <Box args={[10, 10, 2.1]} position={[-5, 10, 0]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
          <Box args={[10, 30, 2.1]} position={[5, 0, 0]}>
            <meshStandardMaterial {...purpleProps} />
          </Box>
        </group>

        {/* --- PLATFORM FLOOR - Widened to hide water gaps under walls --- */}
        <Box args={[34, 1.5, 27]} position={[1, -14.2, 4]}>
          <meshStandardMaterial {...pinkProps} />
        </Box>

        {/* RE-ALIGNED L-BENCH */}
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