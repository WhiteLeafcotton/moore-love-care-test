import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* 🌿 REAL GRASS BLADES */
const GrassBlades = ({ count = 4000 }) => {
  const instancedRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 300,
        z: (Math.random() - 0.5) * 300 - 40,
        scale: 0.5 + Math.random() * 1.2,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    positions.forEach((p, i) => {
      const sway = Math.sin(t * 1.5 + p.offset) * 0.2;

      dummy.position.set(p.x, -3.3, p.z);
      dummy.rotation.set(0, 0, sway);
      dummy.scale.set(0.1, p.scale * 2, 0.1);
      dummy.updateMatrix();

      instancedRef.current.setMatrixAt(i, dummy.matrix);
    });

    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[null, null, count]}>
      <planeGeometry args={[0.1, 1]} />
      <meshStandardMaterial
        color="#7ed957"
        roughness={0.9}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

/* 🌄 Grassy Hills */
const GrassyHills = ({ windSpeed, textureMap }) => {
  const meshRef = useRef();

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 60, 60);
    const vertices = g.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];

      vertices[i + 2] =
        Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 +
        Math.sin(x * 0.08) * 3;
    }

    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * windSpeed) * 0.015;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geom}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.5, -40]}
        receiveShadow
      >
        <meshStandardMaterial
          map={textureMap}
          color="#fff"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* 🌿 ADDING REAL GRASS ON TOP */}
      <GrassBlades />
    </group>
  );
};

/* (everything else unchanged below) */

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";

  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(
    THREE.TextureLoader,
    `${baseUrl}textures/stone_pillar.jpg`
  );
  const waterNormals = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );
  const grassHillsTex = useLoader(
    THREE.TextureLoader,
    `${baseUrl}textures/reference_grass.png`
  );

  useMemo(() => {
    if (grassHillsTex) {
      grassHillsTex.wrapS = grassHillsTex.wrapT =
        THREE.RepeatWrapping;
      grassHillsTex.repeat.set(4, 4);
    }
  }, [grassHillsTex]);

  useEffect(() => {
    camera.position.set(-15, 1.5, 30);
    camera.lookAt(12, 1.5, 0);
  }, [camera]);

  useFrame((state, delta) => {
    camera.lookAt(lookAtTarget.current);
    if (waterRef.current)
      waterRef.current.material.uniforms["time"].value +=
        delta * 0.2;
  });

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[-10, 6, -100]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={12}
        rayleigh={0.3}
      />

      <GrassyHills windSpeed={0.8} textureMap={grassHillsTex} />

      <Environment preset="sunset" />

      <group ref={cloudGroupRef}>
        <Cloud position={[-10, 45, -165]} />
      </group>

      <ContactShadows position={[12, -1.9, 15]} />

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          { waterNormals },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}