import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Box, Cone } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* =========================================
   THE ARTIFACT: INVERTED OCULUS VAULT
   ========================================= */
const VaultMaterial = ({ color }) => (
  <meshStandardMaterial
    color={color}
    roughness={0.9} // Matt texture to absorb light
    metalness={0.05} // Very slight shimmer
  />
);

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // Reusing confirmed workable texture paths
  const renderTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (renderTex) {
      renderTex.wrapS = renderTex.wrapT = THREE.RepeatWrapping;
      renderTex.repeat.set(3, 3);
    }
  }, [renderTex]);

  /* NEW VIEWS: Closer, more intimate framing of the artifact */
  const views = {
    home: { pos: [-15, 6, 25], look: [5, 0, 5] },
    collection: { pos: [30, 12, 40], look: [100, -5, 10] }
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.015);
    targetLook.lerp(new THREE.Vector3(...target.look), 0.015);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.4;
  });

  return (
    <>
      <Sky sunPosition={[45, 0.01, -10]} turbidity={0.1} /> {/* Dawn Light */}
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 10, 150]} />
      
      {/* THE ISOLATED ARTIFACT */}
      <group position={[0, -2, -10]} scale={0.7} rotation={[0, -Math.PI / 4, 0]}>
        
        {/* --- THE SUBMERGED PLINTH FOUNDATION --- */}
        <mesh position={[0, -10, 0]} receiveShadow castShadow>
          <boxGeometry args={[45, 12, 45]} />
          <meshStandardMaterial map={renderTex} color="#d1c4e9" roughness={0.9} /> {/* Purple-tinted Plinth */}
        </mesh>

        {/* --- THE INVERTED CONICAL VAULT --- */}
        <group position={[0, 10, 0]} rotation={[Math.PI, 0, 0]}>
            <mesh receiveShadow castShadow>
                <coneGeometry args={[25, 20, 4]} /> {/* 4-sided 'diamond' cone geometry */}
                <VaultMaterial color="#1a1a1a" /> {/* Deep Obsidian Render */}
            </mesh>
            
            {/* The Oculus: A central circular cutout/skylight */}
            <mesh position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0, 6, 32]} />
                <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={1} transparent opacity={0.6}/>
            </mesh>
        </group>

        {/* --- THE ISOLATED INTERIOR & L-BENCH --- */}
        <group position={[-12, -3.5, -12]} scale={0.9} rotation={[0, Math.PI / 4, 0]}>
          
          {/* Back Travertine Wall Segment */}
          <Box args={[18, 12, 1.5]} position={[0, 0, 0]}>
            <meshStandardMaterial map={renderTex} color="#fcd7d7" roughness={0.9} />
          </Box>
          {/* Side Travertine Wall Segment */}
          <Box args={[1.5, 12, 18]} position={[-8.25, 0, 8.25]}>
            <meshStandardMaterial map={renderTex} color="#fcd7d7" roughness={0.9} />
          </Box>

          {/* L-BENCH (Purple Stone) */}
          <group position={[0, -5, 0]}>
            <Box args={[16, 1.5, 4]} position={[0, 0, -2.5]}>
              <meshStandardMaterial color="#d1c4e9" roughness={0.6} />
            </Box>
            <Box args={[4, 1.5, 14]} position={[-6, 0, 2.5]}>
              <meshStandardMaterial color="#d1c4e9" roughness={0.6} />
            </Box>
          </group>

        </group>

      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          textureWidth: 512, textureHeight: 512, waterNormals,sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, waterColor: 0x999999,distortionScale: 0.5,fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
      <ContactShadows opacity={0.4} scale={200} blur={2.5} far={40} color="#5e4d4d" />
    </>
  );
}