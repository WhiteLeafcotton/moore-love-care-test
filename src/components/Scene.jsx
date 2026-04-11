import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 150000; // The density required for a "Blender" look

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / smoothZone, 1.0);
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const BlenderGrassField = () => {
  const meshRef = useRef();

  // 1. Blade Geometry: Tapered and translated so it grows from the base
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.12, 0.75, 1, 3);
    g.translate(0, 0.375, 0); 
    return g;
  }, []);

  // 2. Realism Shader: Dark roots are the secret to visual thickness
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#050a00") }, // Deep shadows
      uColorTips: { value: new THREE.Color("#95c031") }   // Sun-lit green
    },
    vertexShader: `
      varying float vHeight;
      uniform float uTime;
      void main() {
        vHeight = position.y / 0.75;
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        
        // Organic wind sway
        float wind = sin(uTime * 1.5 + worldPos.x * 0.2) * 0.2 * vHeight;
        vec3 pos = position;
        pos.x += wind;
        pos.z += wind * 0.5;

        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeight;
      uniform vec3 uColorRoots;
      uniform vec3 uColorTips;
      void main() {
        vec3 color = mix(uColorRoots, uColorTips, vHeight);
        gl_FragColor = vec4(color * pow(vHeight, 0.5), 1.0);
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

        dummy.position.set(x, y - 4.1, z);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.rotation.x = (Math.random() - 0.5) * 0.4; // Natural tilt
        dummy.scale.setScalar(0.4 + Math.random() * 0.8);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._init = true;
    }
  });

  return <instancedMesh ref={meshRef} args={[bladeGeo, material, GRASS_COUNT]} />;
};

// CRITICAL: The "export default" fixes your Rollup build error
export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? new THREE.Vector3(-15, 1.5, 30) : new THREE.Vector3(-8, 1.5, -100);
    camera.position.lerp(targetPos, 0.04);
    camera.lookAt(12, 1.5, 0);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} />
      <BlenderGrassField />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 550]} />
      
      <directionalLight position={[-10, 20, 10]} intensity={2} castShadow />
      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          waterNormals,
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