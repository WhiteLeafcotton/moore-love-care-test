import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* =========================
   🌿 GRASS SYSTEM (FIXED)
========================= */
const GrassLayer = ({ count = 18000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.5, 0.7, 1, 3);
    g.translate(0, 0.35, 0);
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

          float windX = sin(instanceMatrix[3].x * 0.08 + time * 1.2);
          float windZ = cos(instanceMatrix[3].z * 0.08 + time * 1.0);

          float wind = (windX + windZ) * 0.12;

          pos.x += wind * vY;
          pos.z += wind * vY * 0.6;

          vec4 mv = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,

      fragmentShader: `
        varying float vY;

        void main() {
          vec3 base = vec3(0.03, 0.18, 0.03);
          vec3 mid  = vec3(0.10, 0.45, 0.10);
          vec3 tip  = vec3(0.25, 0.75, 0.25);

          vec3 col = mix(base, mid, smoothstep(0.0, 0.6, vY));
          col = mix(col, tip, smoothstep(0.6, 1.0, vY));

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
    if (!meshRef.current) return;

    let i = 0;

    positions.forEach((p) => {
      dummy.position.set(p.x, p.y - 3.5, p.z - 40);

      dummy.rotation.y = Math.random() * Math.PI;

      const scale = 0.5 + Math.random() * 2.2;

      dummy.scale.set(
        scale,
        scale * (1.1 + Math.random() * 0.6),
        scale
      );

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      i++;
    });

    meshRef.current.count = positions.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value += delta;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, material, count]}
      frustumCulled={false}
    />
  );
};

/* =========================
   MAIN SCENE
========================= */

export default function Scene({ currentView }) {
  const { camera, size } = useThree();

  const waterRef = useRef();
  const sunPlasmaRef = useRef(); // ✅ FIXED (was missing)
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

  const sunPlasmaTex = useLoader(
    THREE.TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"
  );

  const grassHillsTex = useLoader(
    THREE.TextureLoader,
    `${baseUrl}textures/reference_grass.png`
  );

  useMemo(() => {
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(2, 2);
    }

    if (sunPlasmaTex) {
      sunPlasmaTex.wrapS = sunPlasmaTex.wrapT = THREE.RepeatWrapping;
      sunPlasmaTex.repeat.set(1.5, 1.5);
      sunPlasmaRef.current = sunPlasmaTex;
    }

    if (grassHillsTex) {
      grassHillsTex.wrapS = grassHillsTex.wrapT = THREE.RepeatWrapping;
      grassHillsTex.repeat.set(4, 4);
    }
  }, [pinkStoneTex, sunPlasmaTex, grassHillsTex]);

  const pinkProps = {
    map: pinkStoneTex,
    color: "#fcd7d7",
    roughness: 0.65,
    metalness: 0.05,
  };

  useEffect(() => {
    const startPos = isMobile
      ? new THREE.Vector3(-30, 8, 60)
      : new THREE.Vector3(-15, 1.5, 30);

    camera.position.copy(startPos);
    camera.lookAt(12, 1.5, 0);
  }, [camera, isMobile]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";

    const LERP_SPEED = 0.04;

    const sweetSpotPos = isMobile
      ? new THREE.Vector3(-30, 8, 65)
      : new THREE.Vector3(-15, 1.5, 30);

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

    if (waterRef.current) {
      waterRef.current.material.uniforms.time.value += delta * 0.2;
    }

    if (sunPlasmaRef.current) {
      sunPlasmaRef.current.offset.x += delta * 0.03;
      sunPlasmaRef.current.offset.y -= delta * 0.05;
    }

    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.3;
      if (cloudGroupRef.current.position.x > 500) {
        cloudGroupRef.current.position.x = -500;
      }
    }
  });

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[-10, 2, -100]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={8}
        rayleigh={6}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* 🌿 TERRAIN */}
      <GrassyHills textureMap={grassHillsTex} />
      <GrassLayer count={isMobile ? 12000 : 18000} />

      {/* LIGHT */}
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 450]} />

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.1} />
      <pointLight position={[10, 5, 10]} intensity={0.8} color="#ffd6e7" />

      {/* WATER */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(4000, 4000),
          {
            textureWidth: 1024,
            textureHeight: 1024,
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x224455,
            distortionScale: 0.5,
            alpha: 0.8,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}