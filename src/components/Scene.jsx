import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 250000; // Extreme density for Blender realism

// Standardized Hill Logic for both Ground and Grass
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / smoothZone, 1.0);
  // Matches your "Sanctuary" hill profile
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const BlenderHills = () => {
  const meshRef = useRef();

  // 1. Solid Ground Mesh (Prevents transparency)
  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(650, 650, 128, 128);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 2. High-Density Grass Blade
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.08, 0.8, 1, 2);
    g.translate(0, 0.4, 0); 
    return g;
  }, []);

  // 3. The "Thick" Shader
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#0a1501") }, // Almost black for density
      uColorTips: { value: new THREE.Color("#7ba61a") }
    },
    vertexShader: `
      varying float vHeight;
      uniform float uTime;
      void main() {
        vHeight = position.y / 0.8;
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float wind = sin(uTime * 1.2 + worldPos.x * 0.1) * 0.25 * vHeight;
        vec3 pos = position;
        pos.x += wind;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeight;
      uniform vec3 uColorRoots;
      uniform vec3 uColorTips;
      void main() {
        vec3 color = mix(uColorRoots, uColorTips, vHeight);
        // Fake Ambient Occlusion to make it look "thick"
        gl_FragColor = vec4(color * pow(vHeight, 0.4), 1.0);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 600;
        const y = getHillHeight(x, z);
        
        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.scale.setScalar(0.5 + Math.random() * 0.8);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._init = true;
    }
  });

  return (
    <group position={[0, -4.5, -40]}>
      {/* The Actual Solid Hills */}
      <mesh geometry={terrainGeo}>
        <meshStandardMaterial color="#1a2e05" roughness={1} />
      </mesh>
      {/* The Millions of Blades */}
      <instancedMesh ref={meshRef} args={[bladeGeo, material, GRASS_COUNT]} />
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    camera.position.lerp(isHome ? new THREE.Vector3(-15, 5, 30) : new THREE.Vector3(-8, 5, -100), 0.04);
    camera.lookAt(0, 0, 0);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} />
      <BlenderHills />
      <Environment preset="sunset" />
      <directionalLight position={[-10, 20, 10]} intensity={2.5} castShadow />
      <hemisphereLight intensity={1} color="#ffffff" groundColor="#ffc0e6" />

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          waterNormals: useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"),
          sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
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