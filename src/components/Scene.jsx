import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Water } from "@react-three/drei";
import * as THREE from "three";
// Make sure this utility is imported to handle the geometry merge
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

const GrassyHills = () => {
  const instanceRef = useRef();
  
  // 100,000 instances for a true "carpet" look. 
  // InstancedMesh handles this easily on modern GPUs.
  const count = 100000; 

  const getHeight = (x, y) => {
    return Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 + Math.sin(x * 0.08) * 3;
  };

  const { geometry, terrainGeom } = useMemo(() => {
    const tg = new THREE.PlaneGeometry(400, 400, 100, 100);
    const pos = tg.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = getHeight(pos[i], pos[i + 1]);
    }
    tg.computeVertexNormals();

    // The "Star" geometry: 3 planes ensure the grass is thick from every angle
    const baseG = new THREE.PlaneGeometry(0.25, 1.8, 1, 2);
    baseG.translate(0, 0.9, 0); 
    const starGeo = BufferGeometryUtils.mergeGeometries([
      baseG.clone(),
      baseG.clone().rotateY(Math.PI / 3),
      baseG.clone().rotateY((Math.PI / 3) * 2)
    ]);

    return { geometry: starGeo, terrainGeom: tg };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const root = Math.sqrt(count);
    const size = 380; // Area size
    const spacing = size / root;

    for (let i = 0; i < count; i++) {
      // GRID PLACEMENT: Ensures every inch is covered
      const ix = i % root;
      const iy = Math.floor(i / root);
      
      const x = (ix * spacing - size/2) + (Math.random() - 0.5) * spacing;
      const y = (iy * spacing - size/2) + (Math.random() - 0.5) * spacing;
      const z = getHeight(x, y);

      dummy.position.set(x, y, z);
      // Random rotation so it looks natural
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      // Random scale for that "wild" look
      dummy.scale.setScalar(0.7 + Math.random() * 0.8);
      
      dummy.updateMatrix();
      instanceRef.current.setMatrixAt(i, dummy.matrix);
    }
    instanceRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -20]}>
      {/* Dark ground to make the grass pop */}
      <mesh geometry={terrainGeom}>
        <meshStandardMaterial color="#020802" />
      </mesh>
      <instancedMesh ref={instanceRef} args={[geometry, null, count]}>
        <meshStandardMaterial color="#4e7a54" side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
};

export default function Scene() {
  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 6, -100]} />
      <Environment preset="sunset" />
      <GrassyHills />
      <directionalLight position={[-10, 20, 10]} intensity={1.5} />
    </>
  );
}
/* -------------------------------------------------------------------------- */
/* 3. MAIN SCENE                                                              */
/* -------------------------------------------------------------------------- */

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useEffect(() => {
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(2, 2);
    }
  }, [pinkStoneTex]);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const sweetSpotPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const sweetSpotLook = new THREE.Vector3(12, 1.5, 0);
    const exitFinalPos = new THREE.Vector3(-8, 1.5, -100);
    const exitLook = new THREE.Vector3(-8, 1.5, -200);

    if (isHome) {
      camera.position.lerp(sweetSpotPos, LERP_SPEED);
      lookAtTarget.current.lerp(sweetSpotLook, LERP_SPEED);
    } else {
      camera.position.lerp(exitFinalPos, LERP_SPEED);
      lookAtTarget.current.lerp(exitLook, LERP_SPEED);
    }
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 1.8;
      if (cloudGroupRef.current.position.x > 180) cloudGroupRef.current.position.x = -180;
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 6, -100]} inclination={0.49} azimuth={0.25} turbidity={12} rayleigh={0.3} />
      
      <GrassyHills windSpeed={0.8} />

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 320]} />

      <mesh position={[-10, 45, -180]}>
        <sphereGeometry args={[isMobile ? 18 : 22, 64, 64]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffba5c" emissiveIntensity={4} transparent opacity={0.7} />
        <pointLight intensity={5} distance={400} color="#fff1d4" />
      </mesh>

      <group ref={cloudGroupRef}>
        <Cloud position={[-10, 45, -165]} opacity={0.7} segments={30} bounds={[50, 20, 10]} volume={20} color="#ffd1dc" />
        <Cloud position={[30, 55, -175]} opacity={0.6} segments={25} bounds={[40, 15, 5]} volume={15} color="#e6e6fa" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <pointLight position={[10, 5, 10]} intensity={0.8} color="#ffd6e7" />

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        <group position={[-16, -1, 0]}>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}>
            <boxGeometry args={[18, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
        </group>
      </group>
      
      <ContactShadows position={[12, -1.9, 15]} opacity={0.15} scale={60} blur={4} far={12} />

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x224455,
            distortionScale: 0.4,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}