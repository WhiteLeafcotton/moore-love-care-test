import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GrassLayer = ({ count = 18000 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 🌿 wider + shorter = TURF look (NOT blades)
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.5, 0.7, 1, 3);
    g.translate(0, 0.35, 0);
    return g;
  }, []);

  // 🌬️ softer wind + better color blending
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },

      vertexShader: `
        uniform float time;
        varying float vY;

        void main() {
          vY = position.y;

          vec3 pos = position;

          // smoother wind field (less "sine spam")
          float windX =
            sin(instanceMatrix[3].x * 0.08 + time * 1.2);

          float windZ =
            cos(instanceMatrix[3].z * 0.08 + time * 1.0);

          float wind = (windX + windZ) * 0.12;

          // bend entire tuft, not just top
          pos.x += wind * vY;
          pos.z += wind * vY * 0.6;

          vec4 mv = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,

      fragmentShader: `
        varying float vY;

        void main() {
          // 🌿 key: darker base = denser illusion
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

  // 🌿 better distribution (slight clustering feel)
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

      // 🌿 IMPORTANT: variation = density illusion
      const scale = 0.5 + Math.random() * 2.2;

      dummy.scale.set(
        scale,
        scale * (1.1 + Math.random() * 0.6),
        scale
      );

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

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
      args={[geo, material, positions.length]}
      frustumCulled={false}
    />
  );
};

/* Monolithic Staircase */
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

/* Wall Segment */
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
  const baseUrl = import.meta.env.BASE_URL || "/";

  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const sunPlasmaTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassHillsTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/reference_grass.png`);

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

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useEffect(() => {
    const startPos = isMobile ? new THREE.Vector3(-30, 8, 60) : new THREE.Vector3(-15, 1.5, 30);
    camera.position.copy(startPos);
    camera.lookAt(12, 1.5, 0);
  }, [camera, isMobile]);

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
    if (sunPlasmaRef.current) {
      sunPlasmaRef.current.offset.x += delta * 0.03;
      sunPlasmaRef.current.offset.y -= delta * 0.05;
    }

    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.3;
      if (cloudGroupRef.current.position.x > 500) cloudGroupRef.current.position.x = -500;
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

      <GrassyHills textureMap={grassHillsTex} />

      <mesh position={[-10, 55, -200]}>
        <sphereGeometry args={[isMobile ? 14 : 18, 64, 64]} />
        <meshStandardMaterial 
          color="#fff4e6" 
          emissive="#ffba5c" 
          emissiveMap={sunPlasmaTex}
          emissiveIntensity={1.2} 
          transparent={true}
          opacity={0.5} 
          roughness={0.2}
          metalness={0.5}
        />
        <pointLight intensity={2} distance={500} color="#fff1d4" decay={1.5} />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 450]} />

      {/* RE-ENGINEERED MASSIVE SKY SYSTEM - NO WATER CONTACT */}
      <group ref={cloudGroupRef}>
        {/* Deep Horizon (Y: 70-90) */}
        <Cloud position={[0, 80, -450]} speed={0.2} opacity={0.3} segments={60} bounds={[1000, 100, 50]} volume={150} color="#ffd1dc" />
        <Cloud position={[-100, 100, -420]} speed={0.1} opacity={0.25} segments={50} bounds={[800, 80, 40]} volume={120} color="#ffffff" />
        
        {/* Pastel Yellow Layers (Y: 50-70) */}
        <Cloud position={[300, 60, -320]} speed={0.2} opacity={0.3} segments={50} bounds={[500, 60, 50]} volume={100} color="#fff9c4" />
        <Cloud position={[-300, 55, -300]} speed={0.3} opacity={0.2} segments={50} bounds={[450, 50, 60]} volume={90} color="#fdf4b8" />

        {/* High Altitude White Layers (Y: 110-140) */}
        <Cloud position={[0, 130, -350]} speed={0.4} opacity={0.4} segments={60} bounds={[900, 60, 40]} volume={130} color="#ffffff" />
        <Cloud position={[-400, 110, -380]} speed={0.1} opacity={0.2} segments={50} bounds={[1000, 80, 80]} volume={140} color="#ffffff" />

        {/* Foreground Atmosphere (Y: 45-60) - Raised to keep clear of water line at -1.2 */}
        <Cloud position={[200, 45, -200]} speed={0.2} opacity={0.35} segments={40} bounds={[400, 40, 40]} volume={80} color="#fce7f3" />
        <Cloud position={[-200, 50, -220]} speed={0.2} opacity={0.25} segments={40} bounds={[450, 40, 50]} volume={90} color="#e9d5ff" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.1} />
      <pointLight position={[10, 5, 10]} intensity={0.8} color="#ffd6e7" />

      {/* ARCHITECTURE */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        <group position={[-16, -1, 0]}>
          <mesh castShadow receiveShadow position={[1, 8.5, 0]}><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
        <group position={[17, -1, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[4, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
      </group>
      
      <ContactShadows position={[12, -1.9, 15]} opacity={0.15} scale={60} blur={4} far={12} />

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(4000, 4000),
          {
            textureWidth: isMobile ? 512 : 1024,
            textureHeight: isMobile ? 512 : 1024,
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x224455,
            distortionScale: isMobile ? 0.3 : 0.5,
            alpha: 0.8,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}