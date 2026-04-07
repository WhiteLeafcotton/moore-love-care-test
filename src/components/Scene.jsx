import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const baseUrl = import.meta.env.BASE_URL || "/";

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const travertineTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/travertine.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    [pinkStoneTex, travertineTex, waterNormals].forEach(t => {
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; }
    });
    if (travertineTex) travertineTex.repeat.set(1.5, 10); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1.5, 10);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  /* REFINED CINEMATIC PATHWAY:
     - Home: Moves forward INTO the room and turns 90 degrees RIGHT to face the inner corner.
     - Collection: Lateral exit through the side wall remains perfect.
  */
  const views = {
    home: { 
      // Positioned inside the room, slightly to the left of center
      pos: [-15, 4, 10],      
      // Target is now far to the RIGHT and BACK to force that 90-degree corner view
      look: [40, 2, -15]    
    },
    collection: { 
      pos: [90, 3, 20], 
      look: [160, 2, 20] 
    } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.012); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.012);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.3;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 30, 200]} />
      
      {/* CLEAN FLOATING CORNER ROOM */}
<group position={[0, 4, -12]}>

  {/* FLOOR */}
  <mesh position={[0, -15, 0]} receiveShadow>
    <boxGeometry args={[60, 2, 60]} />
    <meshStandardMaterial map={travertineTex} color="#f5dcd6" />
  </mesh>

  {/* LEFT WALL (WITH REAL OPENINGS) */}
  <group position={[-30, 5, 0]}>

    {/* TOP WALL */}
    <mesh position={[0, 15, 0]}>
      <boxGeometry args={[2, 10, 60]} />
      <meshStandardMaterial map={travertineTex} />
    </mesh>

    {/* BOTTOM WALL */}
    <mesh position={[0, -15, 0]}>
      <boxGeometry args={[2, 10, 60]} />
      <meshStandardMaterial map={travertineTex} />
    </mesh>

    {/* SIDE STRIPS BETWEEN DOORS */}
    <mesh position={[0, 0, -25]}>
      <boxGeometry args={[2, 20, 10]} />
      <meshStandardMaterial map={travertineTex} />
    </mesh>

    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 20, 10]} />
      <meshStandardMaterial map={travertineTex} />
    </mesh>

    <mesh position={[0, 0, 25]}>
      <boxGeometry args={[2, 20, 10]} />
      <meshStandardMaterial map={travertineTex} />
    </mesh>

    {/* ARCH 1 */}
    <mesh position={[0, 5, -12]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[6, 6, 2, 32, 1, false, 0, Math.PI]} />
      <meshStandardMaterial map={travertineTex} />
    </mesh>

    {/* ARCH 2 */}
    <mesh position={[0, 5, 12]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[6, 6, 2, 32, 1, false, 0, Math.PI]} />
      <meshStandardMaterial map={travertineTex} />
    </mesh>

  </group>

  {/* RIGHT WALL (WINDOW CUTOUT STYLE) */}
  <group position={[0, 5, 30]} rotation={[0, Math.PI / 2, 0]}>

    {/* TOP */}
    <mesh position={[0, 15, 0]}>
      <boxGeometry args={[2, 10, 60]} />
      <meshStandardMaterial map={pinkStoneTex} />
    </mesh>

    {/* BOTTOM */}
    <mesh position={[0, -15, 0]}>
      <boxGeometry args={[2, 10, 60]} />
      <meshStandardMaterial map={pinkStoneTex} />
    </mesh>

    {/* SIDE SEGMENTS */}
    <mesh position={[0, 0, -25]}>
      <boxGeometry args={[2, 20, 10]} />
      <meshStandardMaterial map={pinkStoneTex} />
    </mesh>

    <mesh position={[0, 0, 25]}>
      <boxGeometry args={[2, 20, 10]} />
      <meshStandardMaterial map={pinkStoneTex} />
    </mesh>

    {/* WINDOW FRAME 1 */}
    <mesh position={[0, 5, -12]}>
      <boxGeometry args={[2.2, 14, 14]} />
      <meshStandardMaterial color="#d9d9d9" />
    </mesh>

    {/* GLASS 1 */}
    <mesh position={[0, 5, -12]}>
      <boxGeometry args={[1.8, 12, 12]} />
      <meshPhysicalMaterial transmission={1} roughness={0} thickness={0.5} />
    </mesh>

    {/* WINDOW FRAME 2 */}
    <mesh position={[0, 5, 12]}>
      <boxGeometry args={[2.2, 14, 14]} />
      <meshStandardMaterial color="#d9d9d9" />
    </mesh>

    {/* GLASS 2 */}
    <mesh position={[0, 5, 12]}>
      <boxGeometry args={[1.8, 12, 12]} />
      <meshPhysicalMaterial transmission={1} roughness={0} thickness={0.5} />
    </mesh>

  </group>

</group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(10, 1, 20), sunColor: 0xffffff, 
          waterColor: 0xa19089, distortionScale: 0.8, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      />
      <ContactShadows opacity={0.3} scale={250} blur={3} far={50} color="#5e4d4d" />
    </>
  );
}