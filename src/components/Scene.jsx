import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Box } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* NEW COMPONENT: THICK WALL WITH INTEGRATED CUT-OUTS */
const SanctuaryWall = ({ width, height, thickness = 1.5, position, rotation = [0, 0, 0], material, windowPos = null }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* If we have a window, we build the wall in sections to create the "cut-out" look */}
      {!windowPos ? (
        <Box args={[width, height, thickness]}>
          <meshStandardMaterial {...material} />
        </Box>
      ) : (
        <group>
          {/* Left Side of Wall */}
          <Box args={[(width / 2) - 2, height, thickness]} position={[-(width / 4) - 1, 0, 0]}>
             <meshStandardMaterial {...material} />
          </Box>
          {/* Right Side of Wall */}
          <Box args={[(width / 2) - 2, height, thickness]} position={[(width / 4) + 1, 0, 0]}>
             <meshStandardMaterial {...material} />
          </Box>
          {/* Top Header (The piece above the window) */}
          <Box args={[4, height - 10, thickness]} position={[0, 5, 0]}>
             <meshStandardMaterial {...material} />
          </Box>
          {/* Bottom Sill (The piece below the window) */}
          <Box args={[4, 4, thickness]} position={[0, -3, 0]}>
             <meshStandardMaterial {...material} />
          </Box>
        </group>
      )}
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (travertineTex) {
      travertineTex.wrapS = travertineTex.wrapT = THREE.RepeatWrapping;
      travertineTex.repeat.set(2, 2);
    }
  }, [travertineTex]);

  const travProps = { map: travertineTex, color: "#fcd7d7", roughness: 0.4, metalness: 0.1 };

  /* CAMERA: Updated to an elevated Diorama perspective */
  const views = {
    home: { pos: [25, 12, 45], look: [0, 5, 0] },
    collection: { pos: [-35, 15, 35], look: [-10, 5, 0] }
  };

  const targetLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.03);
    targetLook.lerp(new THREE.Vector3(...target.look), 0.03);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-50, 10, 20]} turbidity={0.1} rayleigh={0.5} />
      <Environment preset="dawn" />

      {/* ================= THICK ARCHITECTURE ================= */}
      <group position={[0, 5, 0]}>
        
        {/* MAIN REAR STRUCTURE - THICK WALL WITH CUTOUTS */}
        <SanctuaryWall 
          width={30} height={20} thickness={2} 
          position={[-10, 5, -15]} 
          material={travProps}
          windowPos={true} 
        />

        {/* SIDE WING - CREATING THE DIORAMA "CORNER" */}
        <SanctuaryWall 
          width={25} height={20} thickness={2} 
          position={[-25, 5, 0]} 
          rotation={[0, Math.PI / 2, 0]}
          material={travProps}
        />

        {/* FLOATING CARVED BENCH (Integrated desk/bed look from reference) */}
        <Box args={[12, 1.5, 6]} position={[-15, -2, -8]}>
          <meshStandardMaterial {...travProps} />
        </Box>

      </group>

      {/* INFINITE WATER BODY */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512, textureHeight: 512, waterNormals,
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff,
          waterColor: 0x8ea3a3, distortionScale: 0.4, fog: true
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      />

      <ContactShadows opacity={0.4} scale={100} blur={3} far={20} color="#000000" />
    </>
  );
}