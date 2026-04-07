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
    if (travertineTex) travertineTex.repeat.set(1.5, 15); 
    if (pinkStoneTex) pinkStoneTex.repeat.set(1.5, 15);
  }, [pinkStoneTex, travertineTex, waterNormals]);

  const views = {
    home: { pos: [24, 2.5, 34], look: [-12, 3.8, -5] },
    collection: { pos: [-110, 3, 55], look: [-140, 2, -10] } 
  };
  
  const targetLook = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const target = views[currentView];
    camera.position.lerp(new THREE.Vector3(...target.pos), 0.02); 
    targetLook.lerp(new THREE.Vector3(...target.look), 0.02);
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.3;
  });

  return (
    <>
      <Sky sunPosition={[-35, 0.08, 15]} turbidity={0.01} rayleigh={3} />
      <Environment preset="dawn" />
      <fog attach="fog" args={["#f7ece8", 30, 200]} />
      
      {/* MONOLITHIC STRUCTURE */}
      <group position={[0, 0, -5]} scale={0.75}>
        
        {/* BACK WALL (Travertine) with Offset Window Slit */}
        <group position={[0, 85, -12]}> 
          <mesh position={[-48, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
          </mesh>

          {/* WINDOW VOID AT -38 */}

          <mesh position={[-14, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[36, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
          </mesh>

          <mesh position={[28, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[32, 180, 4]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.6} />
          </mesh>

          {/* Header over window gap */}
          <mesh position={[-38, 75, 0]}>
            <boxGeometry args={[8, 30, 4.1]} />
            <meshStandardMaterial map={travertineTex} color="#fcd7d7" />
          </mesh>
        </group>

        {/* SIDE WALL (Pink Stone) - Pushed back to Z:18 to clear the window void */}
        <group position={[-54, 85, 18]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-20, 0, 0]} castShadow>
            <boxGeometry args={[35, 180, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
          <mesh position={[25, 0, 0]} castShadow>
            <boxGeometry args={[35, 180, 4]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" roughness={0.8} />
          </mesh>
          <mesh position={[2.5, 75, 0]}>
            <boxGeometry args={[10, 30, 4.1]} />
            <meshStandardMaterial map={pinkStoneTex} color="#ede2df" />
          </mesh>
        </group>

        {/* ANCHOR BENCH */}
        <mesh position={[-25, 2.5, -6]} castShadow receiveShadow>
          <boxGeometry args={[65, 5, 15]} /> 
          <meshStandardMaterial map={travertineTex} color="#fcd7d7" roughness={0.7} />
        </mesh>
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