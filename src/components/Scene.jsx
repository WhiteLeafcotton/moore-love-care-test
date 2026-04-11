import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// Fix: Define baseUrl globally so all components can see it
const baseUrl = import.meta.env.BASE_URL || "/";

const GRASS_COUNT = 500000; 

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / 25, 1.0);

  const hills = [
    { x: 0, z: -80, h: 14, w: 35 },     
    { x: -60, z: -40, h: 10, w: 25 },   
    { x: 65, z: -35, h: 12, w: 30 }     
  ];

  let hillHeight = 0;
  hills.forEach(h => {
    const d = Math.sqrt(Math.pow(x - h.x, 2) + Math.pow(z - h.z, 2));
    hillHeight += Math.exp(-Math.pow(d / h.w, 2)) * h.h;
  });

  return hillHeight * influence;
};

const GrassySassyHills = () => {
  const meshRef = useRef();

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

  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 150, 150);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const grassMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#c78498") }, // Deep Mauve Base
      uColorTips: { value: new THREE.Color("#fcd7d7") }   // Pastel Pink tips
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
        float ao = pow(vHeight, 0.35); 
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
        const y = getHillHeight(x, z);
        if (y > 0.05) {
          dummy.position.set(x, y - 0.05, z);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.rotation.x = (Math.random() - 0.5) * 0.3;
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
    <group position={[0, -3.5, -40]}>
      {/* Darker Pink Soil base for contrast */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial color="#c78498" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[bladeGeo, grassMaterial, GRASS_COUNT]} castShadow receiveShadow />
    </group>
  );
};

/* --- ARCHITECTURE --- */
const Staircase = ({ position, width, texture, rotation }) => {
  const stepHeight = 0.5; const stepDepth = 0.8; const numSteps = 16;
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
  const sunPlasmaRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const sunPlasmaTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useMemo(() => {
    if (pinkStoneTex) { pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping; pinkStoneTex.repeat.set(2, 2); }
    if (sunPlasmaTex) { sunPlasmaTex.wrapS = sunPlasmaTex.wrapT = THREE.RepeatWrapping; sunPlasmaTex.repeat.set(1.5, 1.5); sunPlasmaRef.current = sunPlasmaTex; }
  }, [pinkStoneTex, sunPlasmaTex]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30)) : new THREE.Vector3(-8, 1.5, -100);
    const targetLook = isHome ? new THREE.Vector3(12, 1.5, 0) : new THREE.Vector3(-8, 1.5, -200);

    camera.position.lerp(targetPos, LERP_SPEED);
    lookAtTarget.current.lerp(targetLook, LERP_SPEED);
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

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 2, -100]} inclination={0.6} azimuth={0.25} turbidity={8} rayleigh={6} mieCoefficient={0.005} mieDirectionalG={0.8} />
      
      <mesh position={[-10, 55, -200]}>
        <sphereGeometry args={[isMobile ? 14 : 18, 64, 64]} />
        <meshStandardMaterial color="#fff4e6" emissive="#ffba5c" emissiveMap={sunPlasmaTex} emissiveIntensity={1.2} transparent={true} opacity={0.5} roughness={0.2} metalness={0.5} />
        <pointLight intensity={2.5} distance={600} color="#fff1d4" decay={1.5} />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 450]} />
      <GrassySassyHills />

      <hemisphereLight intensity={1.8} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[20, 50, -20]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[10, 15, 10]} intensity={1.2} color="#ffd6e7" />

      <group ref={cloudGroupRef}>
        <Cloud position={[0, 80, -450]} speed={0.2} opacity={0.3} segments={60} bounds={[1000, 100, 50]} volume={150} color="#ffd1dc" />
        <Cloud position={[-100, 100, -420]} speed={0.1} opacity={0.25} segments={50} bounds={[800, 80, 40]} volume={120} color="#ffffff" />
        <Cloud position={[300, 60, -320]} speed={0.2} opacity={0.3} segments={50} bounds={[500, 60, 50]} volume={100} color="#fff9c4" />
        <Cloud position={[-300, 55, -300]} speed={0.3} opacity={0.2} segments={50} bounds={[450, 50, 60]} volume={90} color="#fdf4b8" />
        <Cloud position={[0, 130, -350]} speed={0.4} opacity={0.4} segments={60} bounds={[900, 60, 40]} volume={130} color="#ffffff" />
        <Cloud position={[-400, 110, -380]} speed={0.1} opacity={0.2} segments={50} bounds={[1000, 80, 80]} volume={140} color="#ffffff" />
        <Cloud position={[200, 45, -200]} speed={0.2} opacity={0.35} segments={40} bounds={[400, 40, 40]} volume={80} color="#fce7f3" />
        <Cloud position={[-200, 50, -220]} speed={0.2} opacity={0.25} segments={40} bounds={[450, 40, 50]} volume={90} color="#e9d5ff" />
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
        args={[new THREE.PlaneGeometry(4000, 4000), {
          waterNormals,
          sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
          sunColor: 0xffffff,
          waterColor: 0x001e0f, 
          alpha: 0.8,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}