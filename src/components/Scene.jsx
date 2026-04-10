import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* ✅ REAL GAME-STYLE GRASS SYSTEM (WITH LOD) */
const GrassyHills = ({ windSpeed, isMobile }) => {
  const terrainRef = useRef();
  const grassRef = useRef();

  /* TERRAIN */
  const terrainGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 60, 60);
    const v = g.attributes.position.array;

    for (let i = 0; i < v.length; i += 3) {
      const x = v[i];
      const y = v[i + 1];
      v[i + 2] =
        Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 +
        Math.sin(x * 0.08) * 3;
    }

    g.computeVertexNormals();
    return g;
  }, []);

  /* GRASS BLADE */
  const bladeGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.12, 1.1, 1, 4);
    g.translate(0, 0.55, 0);
    return g;
  }, []);

  /* ✅ LOD SYSTEM */
  const instanceCount = isMobile ? 2500 : 9000;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!grassRef.current) return;

    for (let i = 0; i < instanceCount; i++) {
      const x = (Math.random() - 0.5) * 350;
      const z = (Math.random() - 0.5) * 350;

      const y =
        Math.sin(x * 0.04) * Math.cos(z * 0.04) * 10 +
        Math.sin(x * 0.08) * 3;

      dummy.position.set(x, y - 3.5, z - 40);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.7 + Math.random() * 0.6);

      dummy.updateMatrix();
      grassRef.current.setMatrixAt(i, dummy.matrix);
    }

    grassRef.current.instanceMatrix.needsUpdate = true;
  }, [instanceCount]);

  /* WIND */
  useFrame((state) => {
    if (grassRef.current) {
      grassRef.current.material.uniforms.time.value =
        state.clock.elapsedTime * windSpeed;
    }
  });

  /* SHADER */
  const grassMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 pos = position;

          float sway = sin(time * 2.0 + position.y * 2.5) * 0.15;
          pos.x += sway * uv.y;

          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;

        void main() {
          vec3 base = mix(
            vec3(0.08, 0.35, 0.08),
            vec3(0.4, 0.85, 0.3),
            vUv.y
          );

          gl_FragColor = vec4(base, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, []);

  return (
    <group>
      {/* TERRAIN */}
      <mesh
        ref={terrainRef}
        geometry={terrainGeom}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.5, -40]}
        receiveShadow
      >
        <meshStandardMaterial color="#3f7d3f" roughness={1} />
      </mesh>

      {/* GRASS */}
      <instancedMesh
        ref={grassRef}
        args={[bladeGeom, grassMaterial, instanceCount]}
      />
    </group>
  );
};

/* Staircase (unchanged) */
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
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} metalness={0.05} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} metalness={0.05} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* WallOpening (unchanged) */
const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]}>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[openingW, 4, 2]} />
        <meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const sunPlasmaRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));

  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `/textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const sunPlasmaTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useEffect(() => {
    const startPos = isMobile ? new THREE.Vector3(-30, 8, 60) : new THREE.Vector3(-15, 1.5, 30);
    camera.position.copy(startPos);
    camera.lookAt(12, 1.5, 0);
  }, [camera, isMobile]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";

    const sweetSpotPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const exitPos = new THREE.Vector3(-8, 1.5, -100);

    camera.position.lerp(isHome ? sweetSpotPos : exitPos, 0.04);
    camera.lookAt(12, 1.5, 0);

    if (waterRef.current) waterRef.current.material.uniforms.time.value += delta * 0.2;
  });

  return (
    <>
      <Sky />
      <Environment preset="sunset" />

      {/* ✅ NEW GRASS */}
      <GrassyHills windSpeed={1.2} isMobile={isMobile} />

      <ContactShadows position={[12, -1.9, 15]} opacity={0.15} scale={60} blur={4} />

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}