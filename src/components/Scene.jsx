import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Cloud, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000; 

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
    const g = new THREE.PlaneGeometry(0.05, 1.2, 1, 4);
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
      uColorRoots: { value: new THREE.Color("#2a0a3d") }, // Darker purple soil/base
      uColorTips: { value: new THREE.Color("#d1a3ff") }  // Lighter pinkish-purple tips
    },
    vertexShader: `
      varying float vHeight;
      uniform float uTime;
      void main() {
        vHeight = position.y / 1.2;
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float swell = sin(uTime * 0.5 + worldPos.x * 0.05 + worldPos.z * 0.05) * 0.3;
        float gust = sin(uTime * 2.0 + worldPos.x * 0.2) * 0.15;
        float totalWind = (swell + gust) * vHeight;
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
        const y = getHillHeight(x, z);
        if (y > 0.05) {
          dummy.position.set(x, y - 0.05, z);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.rotation.x = (Math.random() - 0.5) * 0.2;
          dummy.scale.setScalar(0.6 + Math.random() * 0.8);
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
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial color="#1a0521" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[bladeGeo, grassMaterial, GRASS_COUNT]} castShadow />
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

  useEffect(() => {
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(2, 2);
    }
  }, [pinkStoneTex]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;

    // SWEET SPOT ADJUSTMENTS: Position is higher (y: 6) and closer (z: 25)
    const targetPos = isHome 
      ? (isMobile ? new THREE.Vector3(-35, 12, 70) : new THREE.Vector3(-12, 6, 25)) 
      : new THREE.Vector3(25, 8, 40); // The "Open View" for Collection

    const targetLook = isHome 
      ? new THREE.Vector3(10, 2, 5) 
      : new THREE.Vector3(-20, 0, -20);

    camera.position.lerp(targetPos, LERP_SPEED);
    lookAtTarget.current.lerp(targetLook, LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.3;
      if (cloudGroupRef.current.position.x > 500) cloudGroupRef.current.position.x = -500;
    }
  });

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 5, -100]} inclination={0.6} azimuth={0.25} turbidity={10} rayleigh={5} />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#f8e1ff", 10, 400]} />
      
      <GrassySassyHills />

      <hemisphereLight intensity={1.2} color="#ffffff" groundColor="#b066ff" />
      <directionalLight position={[-15, 30, 10]} intensity={0.5} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffd6e7" />

      <group ref={cloudGroupRef}>
        <Cloud position={[0, 80, -400]} speed={0.2} opacity={0.2} segments={40} color="#ffd1dc" />
        <Cloud position={[-100, 100, -350]} speed={0.1} opacity={0.2} segments={40} color="#ffffff" />
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

      <ContactShadows position={[12, -1.9, 15]} opacity={0.2} scale={60} blur={3} far={10} />

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), {
          waterNormals,
          sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
          sunColor: 0xffffff,
          waterColor: 0x5a3b7d,
          alpha: 0.6,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.4, 0]}
      />
    </>
  );
}