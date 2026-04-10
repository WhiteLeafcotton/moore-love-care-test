import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* Grassy Hills - unchanged */
const GrassyHills = ({ textureMap }) => {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 80, 80);
    const vertices = g.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];

      const dist = Math.sqrt(x * x + y * y);
      const flatZone = 45;
      const smoothZone = 20;
      let influence = 1.0;

      if (dist < flatZone) influence = 0;
      else if (dist < flatZone + smoothZone)
        influence = (dist - flatZone) / smoothZone;

      vertices[i + 2] =
        (Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 +
          Math.sin(x * 0.08) * 3) *
        influence;
    }

    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh
      geometry={geom}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -3.5, -40]}
      receiveShadow
    >
      <meshStandardMaterial map={textureMap} roughness={0.9} />
    </mesh>
  );
};

/* 🔥 AAA INSTANCED GRASS */
const GrassLayer = ({ count = 30000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.12, 1, 1, 4);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying float vY;

        void main() {
          vY = position.y;

          vec3 pos = position;

          float wind = sin(instanceMatrix[3].x * 0.5 + time * 2.0) * 0.25;
          pos.x += wind * vY;

          vec4 mv = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vY;
        void main() {
          vec3 col = mix(vec3(0.08,0.35,0.08), vec3(0.3,0.85,0.2), vY);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, []);

  const positions = useMemo(() => {
    const arr = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;

      const dist = Math.sqrt(x * x + z * z);
      if (dist < 45) continue;

      const y =
        Math.sin(x * 0.04) * Math.cos(z * 0.04) * 10 +
        Math.sin(x * 0.08) * 3;

      arr.push({ x, y, z });
    }

    return arr;
  }, [count]);

  useEffect(() => {
    positions.forEach((p, i) => {
      dummy.position.set(p.x, p.y - 3.5, p.z - 40);

      dummy.rotation.y = Math.random() * Math.PI;
      const s = 0.5 + Math.random() * 0.9;
      dummy.scale.set(s, s, s);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  useFrame((_, d) => {
    meshRef.current.material.uniforms.time.value += d;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, material, positions.length]}
      frustumCulled={false}
    />
  );
};

/* (Everything else unchanged) */
const Staircase = ({ position, width, texture, rotation }) => {
  const stepHeight = 0.5;
  const stepDepth = 0.8;
  const numSteps = 16;

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <group key={i} position={[0, -i * stepHeight, i * stepDepth]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, stepHeight, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const WallOpening = ({ position, colorProps }) => (
  <mesh position={position}>
    <boxGeometry args={[6, 17, 2]} />
    <meshStandardMaterial {...colorProps} />
  </mesh>
);

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));

  const isMobile = size.width < 768;
  const baseUrl = import.meta.env.BASE_URL || "/";

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

  useEffect(() => {
    camera.position.set(-15, 1.5, 30);
    camera.lookAt(12, 1.5, 0);
  }, [camera]);

  useFrame((_, delta) => {
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current)
      waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky />

      {/* BASE TERRAIN */}
      <GrassyHills textureMap={grassHillsTex} />

      {/* 🔥 REAL GRASS LAYER */}
      <GrassLayer count={isMobile ? 12000 : 40000} />

      <Environment preset="sunset" />

      <hemisphereLight intensity={1.5} />
      <directionalLight position={[-15, 30, 10]} intensity={0.3} />

      <ContactShadows position={[12, -1.9, 15]} opacity={0.2} scale={60} />

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(4000, 4000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(1, 1, 1),
            waterColor: 0x224455,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}