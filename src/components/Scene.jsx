import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// 1. The Core Terrain Logic (Matches your Sanctuary layout)
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / smoothZone, 1.0);
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const BlenderGrassHills = () => {
  const count = 60000; // High density for that "thick" Blender look
  const meshRef = useRef();

  // 2. Create the "Blade" Geometry
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.15, 1.2, 1, 3);
    g.translate(0, 0.6, 0); // Origin at the bottom so it "grows" from the hill
    return g;
  }, []);

  // 3. The "Wind & Light" Shader
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorDark: { value: new THREE.Color("#1a2e05") },
      uColorLight: { value: new THREE.Color("#8cb32d") }
    },
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      uniform float uTime;
      
      void main() {
        vUv = uv;
        vHeight = position.y;
        
        vec3 pos = position;
        // Apply wind sway based on height (tops move more)
        float sway = sin(uTime * 2.0 + (instanceMatrix[3][0] * 0.5)) * (vHeight * 0.2);
        pos.x += sway;
        pos.z += sway * 0.5;

        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeight;
      uniform vec3 uColorDark;
      uniform vec3 uColorLight;

      void main() {
        // Gradient from base to tip
        vec3 finalColor = mix(uColorDark, uColorLight, vHeight / 1.2);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  }), []);

  // 4. Scatter logic (The "Geometry Node" equivalent)
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

  useMemo(() => {
    const dummy = new THREE.Object3D();
    const instancedMesh = new THREE.InstancedMesh(bladeGeo, material, count);
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 600;
      const z = (Math.random() - 0.5) * 600;
      const y = getHillHeight(x, z);
      
      dummy.position.set(x, y - 4.1, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.5 + Math.random() * 1.5);
      dummy.updateMatrix();
      
      // We'll set this directly on the ref in the return
    }
  }, []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    
    // Fill the instances manually for the first time
    if (meshRef.current && !meshRef.current._initialized) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 550;
        const z = (Math.random() - 0.5) * 550;
        const y = getHillHeight(x, z);
        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.scale.setScalar(0.4 + Math.random() * 0.8);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._initialized = true;
    }
  });

  return (
    <group position={[0, -4.1, -40]}>
      {/* 1. The Individual Blades */}
      <instancedMesh ref={meshRef} args={[bladeGeo, material, count]} />
      
      {/* 2. The Solid Ground (To prevent "gaps") */}
      <mesh geometry={terrainGeo}>
        <meshStandardMaterial color="#0a1501" roughness={1} />
      </mesh>
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    camera.position.lerp(isHome ? new THREE.Vector3(-15, 1.5, 30) : new THREE.Vector3(-8, 1.5, -100), 0.04);
    camera.lookAt(lookAtTarget.current);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      <BlenderGrassHills />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 550]} />
      <hemisphereLight intensity={2.0} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-10, 20, 10]} intensity={1.5} />
      
      <mesh position={[12, -2.0, 15]}>
        <boxGeometry args={[14, 8.0, 28]} />
        <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" />
      </mesh>

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