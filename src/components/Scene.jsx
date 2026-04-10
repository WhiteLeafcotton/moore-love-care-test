import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// --- HIGH-DENSITY CLUMP SHADERS ---
const grassVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float time;
  
  void main() {
    vUv = uv;
    vHeight = position.y;
    vec3 pos = position;
    
    // Smooth swaying motion based on world position
    float sway = sin(time * 1.5 + (instanceMatrix[3][0] * 0.3) + (instanceMatrix[3][2] * 0.3)) * 0.2;
    pos.x += sway * pow(vHeight, 2.0); // More sway at the top
    
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const grassFragmentShader = `
  varying vec2 vUv;
  varying float vHeight;
  
  void main() {
    // Premium Gradient: Earthy base to golden sun-kissed tips
    vec3 rootColor = vec3(0.05, 0.15, 0.02);
    vec3 tipColor = vec3(0.6, 0.85, 0.3);
    vec3 finalColor = mix(rootColor, tipColor, vHeight);
    
    // Soften the edges of the blades
    if (vUv.x < 0.1 || vUv.x > 0.9) discard;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const PremiumGrass = ({ count = 100000, hillGeom }) => {
  const meshRef = useRef();
  
  // Create a "Cross" geometry for volume (2 intersecting planes)
  const bladeGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.2, 0.9, 1, 4);
    g.translate(0, 0.45, 0); 
    const g2 = g.clone().rotateY(Math.PI / 2);
    const combined = new THREE.BufferGeometry();
    // Merge to create a 3D clump effect
    return THREE.BufferGeometryUtils.mergeGeometries([g, g2]);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = hillGeom.attributes.position.array;

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      // Pick random vertex on hills
      const randomIndex = Math.floor(Math.random() * (positions.length / 3)) * 3;
      const x = positions[randomIndex];
      const y = positions[randomIndex + 1];
      const z = positions[randomIndex + 2];

      const dist = Math.sqrt(x * x + y * y);
      
      // Strict exclusion zone for the central platform/arena
      if (dist < 48) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        // Random scale variation for that "wild" look
        const s = 0.6 + Math.random() * 1.4;
        dummy.scale.set(s, s, s);
      }
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    }
  }, [count, positions]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[bladeGeom, null, count]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -3.5, -40]}
    >
      <shaderMaterial
        vertexShader={grassVertexShader}
        fragmentShader={grassFragmentShader}
        uniforms={{ time: { value: 0 } }}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

/* Grassy Hills Base */
const GrassyHills = ({ textureMap }) => {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(450, 450, 100, 100);
    const vertices = g.attributes.position.array;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const dist = Math.sqrt(x * x + y * y);
      const flatZone = 45;
      const smoothZone = 25;
      let influence = dist < flatZone ? 0 : Math.min(1, (dist - flatZone) / smoothZone);
      vertices[i + 2] = (Math.sin(x * 0.05) * Math.cos(y * 0.05) * 12) * influence;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group>
      <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -40]} receiveShadow>
        <meshStandardMaterial map={textureMap} color="#4a6b36" roughness={1} />
      </mesh>
      <PremiumGrass hillGeom={geom} />
    </group>
  );
};

/* Monolithic Staircase - Combined & Rotated as per Reference */
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
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassHillsTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/reference_grass.png`);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const sweetSpotPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const sweetSpotLook = new THREE.Vector3(12, 1.5, 0);

    if (isHome) {
      camera.position.lerp(sweetSpotPos, LERP_SPEED);
      lookAtTarget.current.lerp(sweetSpotLook, LERP_SPEED);
    }
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.3;
      if (cloudGroupRef.current.position.x > 500) cloudGroupRef.current.position.x = -500;
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 2, -100]} inclination={0.6} azimuth={0.25} />
      <GrassyHills textureMap={grassHillsTex} />

      <mesh position={[-10, 55, -200]}>
        <sphereGeometry args={[isMobile ? 14 : 18, 64, 64]} />
        <meshStandardMaterial color="#fff4e6" emissive="#ffba5c" emissiveIntensity={1.2} />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 20, 400]} />

      <group ref={cloudGroupRef}>
        <Cloud position={[0, 80, -450]} speed={0.2} opacity={0.3} color="#ffd1dc" />
        <Cloud position={[200, 45, -200]} speed={0.2} opacity={0.35} color="#fce7f3" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.1} />

      {/* ARCHITECTURE */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        
        {/* Diagonal Stairs Pressed to Wall Corner */}
        <Staircase 
          position={[5.2, 1.5, 1.0]} 
          rotation={[0, -Math.PI / 4, 0]} 
          width={10} 
          texture={pinkStoneTex} 
        />
        
        <group position={[-16, -1, 0]}>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
        </group>
      </group>

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(4000, 4000),
          {
            textureWidth: 512,
            textureHeight: 512,
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