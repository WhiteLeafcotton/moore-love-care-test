import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

extend({ Water });

// --- CORAL/GRASS SWAY SHADER ---
const coralVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float time;
  
  void main() {
    vUv = uv;
    vHeight = position.y;
    vec3 pos = position;
    
    // Fluid "Coral" Sway: Slower, more rhythmic movement
    float swayX = sin(time * 1.2 + (instanceMatrix[3][0] * 0.2)) * 0.25;
    float swayZ = cos(time * 1.0 + (instanceMatrix[3][2] * 0.2)) * 0.15;
    
    pos.x += swayX * pow(vHeight, 1.5);
    pos.z += swayZ * pow(vHeight, 1.5);
    
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const coralFragmentShader = `
  varying vec2 vUv;
  varying float vHeight;
  
  void main() {
    // Rich, vibrant coral/grass gradient
    vec3 baseColor = vec3(0.1, 0.25, 0.05); // Deep moss
    vec3 midColor = vec3(0.4, 0.7, 0.2);  // Tropical green
    vec3 topColor = vec3(0.8, 0.9, 0.4);  // Sun-kissed highlights
    
    vec3 finalColor = mix(baseColor, midColor, vHeight);
    finalColor = mix(finalColor, topColor, pow(vHeight, 2.0));
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const DenseCoralCarpet = ({ count = 120000, hillGeom }) => {
  const meshRef = useRef();
  
  // Create a thick, volumetric clump (Star shape)
  const clumpGeom = useMemo(() => {
    const base = new THREE.PlaneGeometry(0.3, 1.2, 1, 4);
    base.translate(0, 0.6, 0); 
    const p1 = base.clone();
    const p2 = base.clone().rotateY(Math.PI / 3);
    const p3 = base.clone().rotateY(-Math.PI / 3);
    return BufferGeometryUtils.mergeGeometries([p1, p2, p3]);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = hillGeom.attributes.position.array;

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      // High-density distribution with jitter
      const randomIndex = Math.floor(Math.random() * (positions.length / 3)) * 3;
      const x = positions[randomIndex] + (Math.random() - 0.5) * 3.5; // Overlap jitter
      const z = positions[randomIndex + 1] + (Math.random() - 0.5) * 3.5;
      const y = positions[randomIndex + 2]; // Anchored to hill height

      const dist = Math.sqrt(x * x + z * z);
      
      if (dist < 49) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(x, y - 0.1, z);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(1, 0.8 + Math.random() * 1.5, 1);
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
        vertexShader={coralVertexShader}
        fragmentShader={coralFragmentShader}
        uniforms={{ time: { value: 0 } }}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

const GrassyHills = ({ textureMap }) => {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 100, 100);
    const vertices = g.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const dist = Math.sqrt(x * x + y * y);
      const influence = dist < 45 ? 0 : Math.min(1, (dist - 45) / 25);
      // Hill Height logic
      vertices[i + 2] = (Math.sin(x * 0.05) * Math.cos(y * 0.05) * 12 + Math.sin(x * 0.1) * 2) * influence;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -40]}>
      <mesh geometry={geom} receiveShadow>
        <meshStandardMaterial map={textureMap} color="#1a330d" roughness={1} />
      </mesh>
      <DenseCoralCarpet hillGeom={geom} />
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const grassHillsTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/reference_grass.png`);

  useFrame((state, delta) => {
    const targetPos = size.width < 768 ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    camera.position.lerp(targetPos, 0.04);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 2, -100]} inclination={0.6} azimuth={0.25} />
      <GrassyHills textureMap={grassHillsTex} />

      <mesh position={[-10, 55, -200]}>
        <sphereGeometry args={[20, 64, 64]} />
        <meshStandardMaterial color="#fff4e6" emissive="#ffba5c" emissiveIntensity={1.5} />
      </mesh>

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 400]} />

      <group>
        <Cloud position={[0, 80, -450]} speed={0.2} opacity={0.3} color="#ffd1dc" />
        <Cloud position={[200, 45, -200]} speed={0.2} opacity={0.35} color="#fce7f3" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />

      {/* ARCHITECTURE */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" roughness={0.65} />
        </mesh>
        
        {/* Stairs */}
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[5.0, 1.5 - i * 0.5, 1.0 + i * 0.8]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[20, 0.5, 0.8]} />
            <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
          </mesh>
        ))}

        {/* Walls */}
        <mesh position={[-15, 7.5, 0]}><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" /></mesh>
        <mesh position={[-5, 7.5, 0]}><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" /></mesh>
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