import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// 500k blades concentrated ONLY on the 3 hills
const GRASS_COUNT = 500000; 

// THE 3 HILL DEFINITION (Locked in)
const getHillHeight = (x, z) => {
  const hills = [
    { x: 0, z: 0, h: 14, w: 35 },     // Main Center Hill
    { x: -45, z: -20, h: 10, w: 25 }, // Left Hill
    { x: 45, z: -15, h: 12, w: 30 }   // Right Hill
  ];

  let totalHeight = 0;
  hills.forEach(hill => {
    const d = Math.sqrt(Math.pow(x - hill.x, 2) + Math.pow(z - hill.z, 2));
    totalHeight += Math.exp(-Math.pow(d / hill.w, 2)) * hill.h;
  });
  return totalHeight;
};

const SanctuaryHills = () => {
  const meshRef = useRef();

  // 1. Tapered Realistic Blade Geometry
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.05, 1.2, 1, 3);
    g.translate(0, 0.6, 0); 
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const h = pos[i + 1] / 1.2;
      pos[i] += Math.pow(h, 2) * 0.2; // Natural blade curve
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 2. The Hill Soil Mesh (Solid Base)
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

  // 3. Realistic Shader (Dark roots = Visual density)
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#020500") }, // Deep dark base
      uColorTips: { value: new THREE.Color("#84a83d") }
    },
    vertexShader: `
      varying float vHeight;
      uniform float uTime;
      void main() {
        vHeight = position.y / 1.2;
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float wind = sin(uTime * 1.5 + worldPos.x * 0.1) * 0.2 * vHeight;
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
        float ao = pow(vHeight, 0.35); 
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
        // Scatter ONLY in the 200x200 hill zone
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        const y = getHillHeight(x, z);
        
        // Ensure grass only exists ON the hills
        if (y > 0.1) {
          dummy.position.set(x, y - 0.05, z);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.rotation.x = (Math.random() - 0.5) * 0.2;
          dummy.scale.setScalar(0.7 + Math.random() * 0.7);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.setScalar(0); // Hide if on flat ground
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
      {/* THE SOIL BASE */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial color="#050a00" roughness={1} />
      </mesh>
      {/* THE DENSE GRASS */}
      <instancedMesh ref={meshRef} args={[bladeGeo, material, GRASS_COUNT]} castShadow />
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const target = isHome ? new THREE.Vector3(-15, 8, 40) : new THREE.Vector3(0, 5, -80);
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, 2, 0);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={0.01} rayleigh={1} />
      <Environment preset="sunset" />
      <SanctuaryHills />
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