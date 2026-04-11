import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 500000; 

// THE 3 HILL DEFINITION (Solidified)
const getHillHeight = (x, z) => {
  const hills = [
    { x: 0, z: 0, h: 14, w: 35 },     
    { x: -45, z: -20, h: 10, w: 25 }, 
    { x: 45, z: -15, h: 12, w: 30 }   
  ];
  let totalHeight = 0;
  hills.forEach(hill => {
    const d = Math.sqrt(Math.pow(x - hill.x, 2) + Math.pow(z - hill.z, 2));
    totalHeight += Math.exp(-Math.pow(d / hill.w, 2)) * hill.h;
  });
  return totalHeight;
};

const HyperRealSanctuary = () => {
  const meshRef = useRef();

  // 1. Tapered Blade Geometry (Refined for Motion)
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.04, 1.2, 1, 4);
    g.translate(0, 0.6, 0); 
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const h = pos[i + 1] / 1.2;
      // Adds a permanent organic "droop" to the blades
      pos[i] += Math.pow(h, 2) * 0.15; 
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(300, 300, 150, 150);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 2. THE FLUID MOTION SHADER
  const material = useMemo(() => new THREE.ShaderMaterial({
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
        
        // MULTI-LAYERED WIND (The "Blender" Secret)
        // Layer 1: Slow rolling swell
        float swell = sin(uTime * 0.5 + worldPos.x * 0.05 + worldPos.z * 0.05) * 0.3;
        
        // Layer 2: Fast gusts
        float gust = sin(uTime * 2.0 + worldPos.x * 0.2) * 0.15;
        
        // Layer 3: High-frequency tip shiver
        float shiver = sin(uTime * 6.0 + worldPos.z * 1.5) * 0.02;

        float totalWind = (swell + gust + shiver) * vHeight;

        vec3 pos = position;
        pos.x += totalWind;
        pos.z += totalWind * 0.3; // Adds a bit of diagonal swirl

        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeight;
      uniform vec3 uColorRoots;
      uniform vec3 uColorTips;
      void main() {
        // Aggressive AO (Ambient Occlusion) for thickness
        float ao = pow(vHeight, 0.4); 
        vec3 color = mix(uColorRoots, uColorTips, vHeight);
        gl_FragColor = vec4(color * ao, 1.0);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        const y = getHillHeight(x, z);
        
        if (y > 0.1) {
          dummy.position.set(x, y - 0.05, z);
          dummy.rotation.y = Math.random() * Math.PI;
          // Randomize "rest" lean so it doesn't look like a brush
          dummy.rotation.x = (Math.random() - 0.5) * 0.4;
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
    <group position={[0, -5, 0]}>
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial color="#020500" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[bladeGeo, material, GRASS_COUNT]} castShadow />
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const target = isHome ? new THREE.Vector3(-15, 8, 40) : new THREE.Vector3(0, 5, -85);
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, 2, 0);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={0.01} rayleigh={0.8} />
      <Environment preset="sunset" />
      <HyperRealSanctuary />
      <directionalLight position={[30, 50, 10]} intensity={3.5} castShadow />
      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      
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
        position={[0, -1.5, 0]}
      />
    </>
  );
}