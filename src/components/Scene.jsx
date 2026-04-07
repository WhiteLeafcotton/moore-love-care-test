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
      
      {/* --- FLOATING CORNER ROOM (CLEAN) --- */}
<group position={[0, 4, -12]}>

  {/* FLOOR */}
  <mesh receiveShadow position={[0, -12, 0]}>
    <boxGeometry args={[60, 2, 60]} />
    <meshStandardMaterial map={travertineTex} color="#f1dfd8" />
  </mesh>

  {/* LEFT WALL (ARCHED DOORS) */}
  <group position={[-30, 8, 0]}>
    
    {/* wall base */}
    <mesh>
      <boxGeometry args={[2, 40, 60]} />
      <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
    </mesh>

    {/* DOOR 1 (arched illusion) */}
    <group position={[1.1, -6, -12]}>
      {/* sides */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[0.5, 16, 8]} />
        <meshStandardMaterial map={travertineTex} />
      </mesh>

      {/* arch top */}
      <mesh position={[0, 16, 0]}>
        <cylinderGeometry args={[4, 4, 0.5, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial map={travertineTex} />
        rotation={[0, 0, Math.PI / 2]}
      </mesh>
    </group>

    {/* DOOR 2 */}
    <group position={[1.1, -6, 12]}>
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[0.5, 16, 8]} />
        <meshStandardMaterial map={travertineTex} />
      </mesh>

      <mesh position={[0, 16, 0]}>
        <cylinderGeometry args={[4, 4, 0.5, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial map={travertineTex} />
        rotation={[0, 0, Math.PI / 2]}
      </mesh>
    </group>

  </group>

  {/* RIGHT WALL (WINDOWS) */}
  <group position={[0, 8, 30]} rotation={[0, Math.PI / 2, 0]}>
    
    {/* wall */}
    <mesh>
      <boxGeometry args={[2, 40, 60]} />
      <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
    </mesh>

    {/* WINDOW 1 */}
    <mesh position={[1.1, 5, -12]}>
      <boxGeometry args={[0.5, 10, 10]} />
      <meshStandardMaterial color="#cfe8ff" transparent opacity={0.25} />
    </mesh>

    {/* WINDOW 2 */}
    <mesh position={[1.1, 5, 12]}>
      <boxGeometry args={[0.5, 10, 10]} />
      <meshStandardMaterial color="#cfe8ff" transparent opacity={0.25} />
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