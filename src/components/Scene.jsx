import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* SOLARIUM SANCTUARY: GREEN CORAL REEF SYSTEM
   Replaces grass with 3D "Bio-Clumps" for deep, leafy volume.
*/
const CoralReef = ({ reefTexture }) => {
  const meshRef = useRef();
  // Lower count than grass because each instance is a 3D volume, not a flat plane
  const COUNT = 15000; 
  
  const getHillHeight = (x, z) => {
    const dist = Math.sqrt(x * x + z * z);
    const flatZone = 40;
    const smoothZone = 30;
    let influence = 1.0;
    if (dist < flatZone) influence = 0;
    else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;

    return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
  };

  const hillGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(500, 500, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // CORAL GEOMETRY: Using a Dodecahedron creates that "brain coral" or "leafy clump" 3D look
  const coralGeom = useMemo(() => new THREE.DodecahedronGeometry(0.8, 1), []);

  const dummy = new THREE.Object3D();
  
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      const y = getHillHeight(x, z);
      
      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      
      // Varied scale creates the "reef" texture
      const s = 0.5 + Math.pow(Math.random(), 3) * 4; 
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={[0, -4, -40]}>
      {/* Deep dark base for that high-end contrast */}
      <mesh geometry={hillGeom}>
        <meshStandardMaterial color="#020800" roughness={1} />
      </mesh>
      
      {/* The Coral Reef Instances */}
      <instancedMesh ref={meshRef} args={[coralGeom, null, COUNT]}>
        <meshStandardMaterial 
          map={reefTexture}
          // Vivid "Electric Moss" Green
          color="#9eff00" 
          // Bioluminescent glow effect matches your reference light rays
          emissive="#2d5a00"
          emissiveIntensity={1.2}
          roughness={0.4}
          metalness={0.1}
        />
      </instancedMesh>
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  // Texture that adds "pores" or "leaf veins" to the coral clumps
  const reefTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg");
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const targetPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const exitPos = new THREE.Vector3(-8, 1.5, -100);

    camera.position.lerp(isHome ? targetPos : exitPos, LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      
      <CoralReef reefTexture={reefTex} />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 450]} />

      <hemisphereLight intensity={2} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={1.5} castShadow />

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" roughness={0.6} />
        </mesh>
      </group>

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(5000, 5000),
          {
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 4,
            alpha: 0.8,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}