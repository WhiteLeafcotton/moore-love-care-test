import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* STRUCTURAL COMPONENT: Arched Opening
  Creates a real physical gap by placing a curved "cap" between two pillars.
*/
const ArchedOpening = ({ position, colorProps, width = 6, height = 12, isWindow = false }) => (
  <group position={position}>
    {/* Left Pillar */}
    <mesh position={[-(width / 2 + 1), height / 2, 0]}>
      <boxGeometry args={[2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {/* Right Pillar */}
    <mesh position={[width / 2 + 1, height / 2, 0]}>
      <boxGeometry args={[2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {/* Arch Header */}
    <mesh position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[width / 2 + 1, width / 2 + 1, 2, 32, 1, false, 0, Math.PI]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {/* Sill for windows */}
    {isWindow && (
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[width, 4, 2]} />
        <meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  // Textures
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
      }
    });
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.8 };
  const purpleProps = { map: travertineTex, color: "#d1c4e9", roughness: 0.8 };

  useFrame((state, delta) => {
    // CAMERA: Locked to a high-angle corner view to verify geometry
    const targetPos = currentView === 'home' ? [-45, 20, 45] : [50, 15, 30];
    const targetLook = currentView === 'home' ? [0, 5, 0] : [100, 5, 10];
    
    camera.position.lerp(new THREE.Vector3(...targetPos), 0.03);
    camera.lookAt(new THREE.Vector3(...targetLook));
    
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.2;
    }
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.1} />
      <Environment preset="dawn" />
      
      <group position={[0, 0, 0]}>
        {/* MAIN FLOOR PLATFORM */}
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[50, 1, 50]} />
          <meshStandardMaterial map={travertineTex} color="#f1dfd8" />
        </mesh>

        {/* BACK PINK WALL (Left Side) */}
        <group position={[-24, 0, 0]}>
          {/* Main Wall Fillers */}
          <mesh position={[0, 15, -20]}>
            <boxGeometry args={[2, 30, 10]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
          <mesh position={[0, 15, 20]}>
            <boxGeometry args={[2, 30, 10]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
          <mesh position={[0, 15, 0]}>
            <boxGeometry args={[2, 30, 6]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>

          {/* Arched Doorways */}
          <ArchedOpening position={[0.1, 0, -10]} width={8} height={14} colorProps={pinkProps} />
          <ArchedOpening position={[0.1, 0, 10]} width={8} height={14} colorProps={pinkProps} />
        </group>

        {/* SIDE PURPLE WALL (Right Side - 90 Degree Turn) */}
        <group position={[0, 0, -24]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 15, -15]}>
            <boxGeometry args={[2, 30, 20]} />
            <meshStandardMaterial {...purpleProps} />
          </mesh>
          <mesh position={[0, 15, 15]}>
            <boxGeometry args={[2, 30, 20]} />
            <meshStandardMaterial {...purpleProps} />
          </mesh>

          {/* Arched Window */}
          <ArchedOpening position={[0.1, 0, 0]} width={6} height={10} isWindow={true} colorProps={purpleProps} />
        </group>
      </group>

      {/* WATER */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals,
          sunDirection: new THREE.Vector3(10, 1, 20),
          sunColor: 0xffffff,
          waterColor: 0xa19089,
          distortionScale: 0.5,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      />
      
      <ContactShadows opacity={0.4} scale={100} blur={2} far={20} color="#000000" />
    </>
  );
}