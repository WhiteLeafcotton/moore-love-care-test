import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// 1. LOCKED-IN DENSITY (500k Blades for Total Coverage)
const GRASS_COUNT = 500000; 

// 2. LOCKED-IN HILL LOGIC
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  let influence = dist < 45 ? 0 : Math.min((dist - 45) / 25, 1.0);
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const RealisticBlenderGrass = () => {
  const meshRef = useRef();
  
  // 3. GENERATE REALISTIC BLADE GEOMETRY (Tapered & Curved)
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.04, 1.2, 1, 3); // Very thin, tall blade
    g.translate(0, 0.6, 0); // Origin at base
    
    // Add realistic curve and randomized lean
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const h = pos[i + 1] / 1.2; // Normalize height (0 to 1)
      pos[i] += Math.pow(h, 2) * 0.18; // Curve Y to X (lean)
      pos[i + 2] += Math.pow(h, 2) * 0.08; // Curve Y to Z (depth)
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 4. LOCKED-IN SHADER (Ambient Occlusion + Wind)
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#030501") }, // Dark base for thickness
      uColorTips: { value: new THREE.Color("#84a83d") }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vHeightFactor;
      uniform float uTime;

      void main() {
        vUv = uv;
        vHeightFactor = position.y / 1.2;
        
        // Complex Wind: Wide waves + Local turbulence
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float wind = sin(uTime * 1.5 + worldPos.x * 0.1) * 0.25 * vHeightFactor;
        wind += sin(uTime * 3.5 + worldPos.x * 0.5) * 0.05 * vHeightFactor;
        
        vec3 pos = position;
        pos.x += wind;
        pos.z += wind * 0.5;

        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeightFactor;
      uniform vec3 uColorRoots;
      uniform vec3 uColorTips;

      void main() {
        // Roots are darker to create "mat" thickness
        float ao = pow(vHeightFactor, 0.4); 
        vec3 color = mix(uColorRoots, uColorTips, vHeightFactor);
        gl_FragColor = vec4(color * ao, 1.0);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  // 5. LOCKED-IN SCATTER LOGIC
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        // Scatter across the 600x600 field
        const x = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 600;
        const y = getHillHeight(x, z);
        
        dummy.position.set(x, y - 0.15, z);
        dummy.rotation.y = Math.random() * Math.PI;
        
        // Randomize the lean and scale for realism
        dummy.rotation.x = (Math.random() - 0.5) * 0.3; // Lean jitter
        dummy.scale.setScalar(0.5 + Math.random() * 0.8);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._init = true;
    }
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[bladeGeo, material, GRASS_COUNT]} 
      position={[0, -4.5, -40]} 
      castShadow
    />
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const target = isHome ? new THREE.Vector3(-15, 6, 35) : new THREE.Vector3(-8, 4, -120);
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, 0, 0);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={0.05} rayleigh={1} />
      <Environment preset="sunset" />
      <RealisticBlenderGrass />
      
      {/* 6. Professional Lighting for Form */}
      <directionalLight position={[20, 50, 10]} intensity={3} castShadow />
      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          waterNormals: useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"),
          waterColor: 0x001e0f,
          alpha: 0.8,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}