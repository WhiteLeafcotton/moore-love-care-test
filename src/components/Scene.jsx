import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* -------------------------------------------------------------------------- */
/* 1. 3D CARPET GRASS COMPONENT                                               */
/* -------------------------------------------------------------------------- */
const GrassyHills = ({ windSpeed = 0.8 }) => {
  const instanceRef = useRef();
  const count = 100000; // High density for the "carpet" look

  const getHeight = (x, y) => {
    return Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 + Math.sin(x * 0.08) * 3;
  };

  const { geometry, terrainGeom } = useMemo(() => {
    // 1. Terrain Geometry
    const tg = new THREE.PlaneGeometry(400, 400, 100, 100);
    const pos = tg.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = getHeight(pos[i], pos[i + 1]);
    }
    tg.computeVertexNormals();

    // 2. Cross-Blade Geometry (Native fix to avoid BufferGeometryUtils crash)
    const bladeW = 0.2;
    const bladeH = 1.5;
    const g1 = new THREE.PlaneGeometry(bladeW, bladeH, 1, 4);
    g1.translate(0, bladeH / 2, 0); 
    const g2 = g1.clone().rotateY(Math.PI / 2);
    
    // Manual merge of attributes to ensure zero external dependencies
    const geometry = new THREE.BufferGeometry();
    const pos1 = g1.attributes.position.array;
    const pos2 = g2.attributes.position.array;
    const combinedPos = new Float32Array(pos1.length + pos2.length);
    combinedPos.set(pos1);
    combinedPos.set(pos2, pos1.length);
    geometry.setAttribute('position', new THREE.BufferAttribute(combinedPos, 3));
    
    const uv1 = g1.attributes.uv.array;
    const uv2 = g2.attributes.uv.array;
    const combinedUv = new Float32Array(uv1.length + uv2.length);
    combinedUv.set(uv1);
    combinedUv.set(uv2, uv1.length);
    geometry.setAttribute('uv', new THREE.BufferAttribute(combinedUv, 2));

    return { geometry, terrainGeom: tg };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const root = Math.sqrt(count);
    const size = 380;
    const spacing = size / root;

    for (let i = 0; i < count; i++) {
      // GRID PLACEMENT: Ensures even carpet coverage across hills
      const ix = i % root;
      const iy = Math.floor(i / root);
      
      const x = (ix * spacing - size/2) + (Math.random() - 0.5) * spacing;
      const y = (iy * spacing - size/2) + (Math.random() - 0.5) * spacing;
      const z = getHeight(x, y);

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.setScalar(0.5 + Math.random() * 1.2);
      
      dummy.updateMatrix();
      instanceRef.current.setMatrixAt(i, dummy.matrix);
    }
    instanceRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  const grassMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#4e7a54",
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime; varying float vHeight;` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        vec3 transformed = vec3(position);
        vHeight = position.y;
        float wave = sin(uTime + instanceMatrix[3][0] * 0.3) * 0.2;
        transformed.x += pow(max(0.0, vHeight), 2.0) * wave;
        `
      );
      mat.userData.shader = shader;
    };
    return mat;
  }, []);

  useFrame((state) => {
    if (grassMaterial.userData.shader) {
      grassMaterial.userData.shader.uniforms.uTime.value = state.clock.elapsedTime * windSpeed;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -20]}>
      <mesh geometry={terrainGeom}>
        <meshStandardMaterial color="#020802" />
      </mesh>
      <instancedMesh ref={instanceRef} args={[geometry, grassMaterial, count]} castShadow />
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. ARCHITECTURAL HELPERS                                                   */
/* -------------------------------------------------------------------------- */
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
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 17, openingH = 9 }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[0, height - (height - openingH) / 2, 0]}>
      <boxGeometry args={[openingW, height - openingH, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
  </group>
);

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
    const targetPos = isHome 
      ? (isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30))
      : new THREE.Vector3(-8, 1.5, -100);

    camera.position.lerp(targetPos, LERP_SPEED);
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
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 320]} />

      <GrassyHills windSpeed={0.8} />

      <mesh position={[-10, 45, -180]}>
        <sphereGeometry args={[isMobile ? 18 : 22, 64, 64]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffba5c" emissiveIntensity={4} transparent opacity={0.7} />
        <pointLight intensity={5} distance={400} color="#fff1d4" />
      </mesh>

      <group ref={cloudGroupRef}>
        <Cloud position={[-10, 45, -165]} opacity={0.7} segments={30} bounds={[50, 20, 10]} volume={20} color="#ffd1dc" />
        <Cloud position={[30, 55, -175]} opacity={0.6} segments={25} bounds={[40, 15, 5]} volume={15} color="#e6e6fa" />
      </group>

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        <group position={[-16, -1, 0]}>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
        </group>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), {
          waterNormals,
          sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
          waterColor: 0x224455,
          distortionScale: 0.4,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}