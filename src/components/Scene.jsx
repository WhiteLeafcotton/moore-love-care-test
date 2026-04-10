import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

extend({ Water });

// --- GRASS SHADERS FOR MOTION AND COLOR ---
const grassVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float time;
  
  void main() {
    vUv = uv;
    vHeight = position.y;
    vec3 pos = position;
    
    // Wind motion: sway increases with height
    float sway = sin(time * 2.0 + (instanceMatrix[3][0] * 0.4)) * 0.15;
    pos.x += sway * vHeight; 
    
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const grassFragmentShader = `
  varying vec2 vUv;
  varying float vHeight;
  
  void main() {
    // Gradient from dark earth to sun-kissed tips
    vec3 rootColor = vec3(0.02, 0.1, 0.02);
    vec3 tipColor = vec3(0.4, 0.7, 0.2);
    vec3 finalColor = mix(rootColor, tipColor, vHeight);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const PremiumGrass = ({ count = 80000, hillGeom }) => {
  const meshRef = useRef();
  
  // Create a 3D "Clump" by merging three crossed planes
  const clumpGeom = useMemo(() => {
    const base = new THREE.PlaneGeometry(0.15, 1.0, 1, 4);
    base.translate(0, 0.5, 0); // Pivot at the bottom
    
    const p1 = base.clone();
    const p2 = base.clone().rotateY(Math.PI / 3);
    const p3 = base.clone().rotateY(-Math.PI / 3);
    
    return BufferGeometryUtils.mergeGeometries([p1, p2, p3]);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = hillGeom.attributes.position.array;

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      // Pick a random vertex from the hill geometry
      const randomIndex = Math.floor(Math.random() * (positions.length / 3)) * 3;
      const x = positions[randomIndex] + (Math.random() - 0.5) * 2; // Add Jitter
      const y = positions[randomIndex + 2]; // In PlaneGeom, Z is height
      const z = positions[randomIndex + 1] + (Math.random() - 0.5) * 2;

      const dist = Math.sqrt(x * x + z * z);
      
      // Keep the center clear for the architecture
      if (dist < 50) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(x, y - 0.2, z);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.setScalar(0.5 + Math.random() * 1.5);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[clumpGeom, null, count]}>
      <shaderMaterial
        vertexShader={grassVertexShader}
        fragmentShader={grassFragmentShader}
        uniforms={{ time: { value: 0 } }}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

const GrassyHills = ({ textureMap }) => {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 80, 80);
    const vertices = g.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const dist = Math.sqrt(x * x + y * y);
      const influence = dist < 45 ? 0 : Math.min(1, (dist - 45) / 20);
      vertices[i + 2] = (Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10) * influence;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -40]}>
      <mesh geometry={geom} receiveShadow>
        <meshStandardMaterial map={textureMap} color="#2d4c1e" roughness={1} />
      </mesh>
      <PremiumGrass hillGeom={geom} />
    </group>
  );
};

const Staircase = ({ position, width, texture, rotation }) => {
  const numSteps = 16;
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <group key={i} position={[0, -i * 0.5, i * 0.8]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, 0.5, 0.8]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.5} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, 0.8]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

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

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassHillsTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/reference_grass.png`);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = size.width < 768 ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    camera.position.lerp(targetPos, 0.04);
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
        <sphereGeometry args={[18, 64, 64]} />
        <meshStandardMaterial color="#fff4e6" emissive="#ffba5c" emissiveIntensity={1.2} />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 450]} />

      <group ref={cloudGroupRef}>
        <Cloud position={[0, 80, -450]} speed={0.2} opacity={0.3} segments={60} color="#ffd1dc" />
        <Cloud position={[200, 45, -200]} speed={0.2} opacity={0.35} color="#fce7f3" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />

      {/* ARCHITECTURE */}
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