import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 500000; 

/* THE GRASSY SASSY LOGIC (Locked to your exact hill math) */
const getSassyHeight = (x, y) => {
  const dist = Math.sqrt(x * x + y * y);
  const flatZone = 45;
  const smoothZone = 20;
  let influence = 1.0;
  
  if (dist < flatZone) {
    influence = 0;
  } else if (dist < flatZone + smoothZone) {
    influence = (dist - flatZone) / smoothZone;
  }

  // YOUR ORIGINAL HILL MATH - DO NOT CHANGE
  return (
    Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 + 
    Math.sin(x * 0.08) * 3
  ) * influence;
};

const GrassySassyHills = () => {
  const meshRef = useRef();

  // 1. Blade Geometry (Realistic Taper)
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.04, 1.2, 1, 4);
    g.translate(0, 0.6, 0); 
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const h = pos[i + 1] / 1.2;
      pos[i] += Math.pow(h, 2) * 0.15; 
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 2. The Soil Base (Matches your old Hills exactly)
  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 80, 80);
    const vertices = g.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = getSassyHeight(vertices[i], vertices[i + 1]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 3. Fluid Motion Shader
  const grassMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#010400") }, 
      uColorTips: { value: new THREE.Color("#8fb83e") }
    },
    vertexShader: `
      varying float vHeight;
      uniform float uTime;
      void main() {
        vHeight = position.y / 1.2;
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float swell = sin(uTime * 0.5 + worldPos.x * 0.05 + worldPos.z * 0.05) * 0.3;
        float gust = sin(uTime * 2.0 + worldPos.x * 0.2) * 0.15;
        float shiver = sin(uTime * 6.0 + worldPos.z * 1.5) * 0.02;
        float totalWind = (swell + gust + shiver) * vHeight;
        vec3 pos = position;
        pos.x += totalWind;
        pos.z += totalWind * 0.3;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeight;
      uniform vec3 uColorRoots;
      uniform vec3 uColorTips;
      void main() {
        float ao = pow(vHeight, 0.4); 
        vec3 color = mix(uColorRoots, uColorTips, vHeight);
        gl_FragColor = vec4(color * ao, 1.0);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  useFrame((state) => {
    grassMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        const y = getSassyHeight(x, z);
        
        if (y > 0.05) {
          dummy.position.set(x, y - 0.1, z);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.scale.setScalar(0.7 + Math.random() * 0.7);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._init = true;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -40]}>
      <mesh geometry={terrainGeo}>
        <meshStandardMaterial color="#020500" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[bladeGeo, grassMaterial, GRASS_COUNT]} castShadow />
    </group>
  );
};

/* --- NO CHANGES BELOW (Your Original Structures) --- */
const Staircase = ({ position, width, texture, rotation }) => {
  const stepHeight = 0.5; const stepDepth = 0.8; const numSteps = 16;
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
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[openingW, 4, 2]} /><meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const isMobile = size.width < 768;

  const baseUrl = import.meta.env.BASE_URL || "/";
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30)) : new THREE.Vector3(-8, 1.5, -100);
    const targetLook = isHome ? new THREE.Vector3(12, 1.5, 0) : new THREE.Vector3(-8, 1.5, -200);

    camera.position.lerp(targetPos, LERP_SPEED);
    lookAtTarget.current.lerp(targetLook, LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.3;
      if (cloudGroupRef.current.position.x > 500) cloudGroupRef.current.position.x = -500;
    }
  });

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  return (
    <>
      <Sky sunPosition={[-10, 2, -100]} turbidity={8} rayleigh={6} />
      <Environment preset="sunset" />
      
      <GrassySassyHills />

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.1} />

      <group ref={cloudGroupRef}>
        <Cloud position={[0, 80, -450]} speed={0.2} opacity={0.3} segments={60} color="#ffd1dc" />
        <Cloud position={[300, 60, -320]} speed={0.2} opacity={0.3} segments={50} color="#fff9c4" />
      </group>

      <group position={[0, 0, 0]}>
        <mesh position={[12, -2.0, 15]} castShadow receiveShadow>
          <boxGeometry args={[14, 8.0, 28]} /><meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        <group position={[-16, -1, 0]}>
          <mesh position={[1, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh position={[24, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(4000, 4000), {
          waterNormals,
          sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
          sunColor: 0xffffff,
          waterColor: 0x224455,
          alpha: 0.8,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}