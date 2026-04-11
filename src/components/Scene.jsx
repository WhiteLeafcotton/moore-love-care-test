import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = 1.0;
  if (dist < flatZone) influence = 0;
  else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const VolumetricMoss = () => {
  const meshRef = useRef();
  const SHELL_COUNT = 20; // More shells = softer, more realistic look
  
  // 1. Create Hill Geometry
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(650, 650, 128, 128);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    
    // Create a custom attribute for the shell index
    const instancedIndex = new Float32Array(SHELL_COUNT * g.attributes.position.count);
    g.computeVertexNormals();
    return g;
  }, []);

  // 2. The Professional Moss Shader
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorDark: { value: new THREE.Color("#0a1501") }, // Deep base
      uColorLight: { value: new THREE.Color("#7ba61a") }, // Soft sunlit tip
      uShellCount: { value: SHELL_COUNT }
    },
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeightFactor;
      uniform float uShellCount;

      void main() {
        vUv = uv;
        
        // Use the instance matrix index to determine height offset
        // In InstancedMesh, we can calculate height factor per instance
        vHeightFactor = float(gl_InstanceID) / uShellCount;
        
        vec3 pos = position;
        // Each layer is slightly higher than the last
        pos.y += vHeightFactor * 2.5; 
        
        // Add a tiny bit of "wind" sway to the tips
        float sway = sin(uTime + pos.x * 0.1) * 0.2 * vHeightFactor;
        pos.x += sway;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeightFactor;
      uniform vec3 uColorDark;
      uniform vec3 uColorLight;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        // High-frequency noise for "grass blades"
        float noise = hash(vUv * 1500.0);
        
        // The higher the layer, the more pixels we "discard"
        // This creates the illusion of individual strands
        if (noise < vHeightFactor) discard;

        // Color gradient from dark roots to light tips
        vec3 color = mix(uColorDark, uColorLight, vHeightFactor);
        
        // Darken the base layers significantly for depth/occlusion
        float ambientOcclusion = pow(vHeightFactor, 0.5);
        
        gl_FragColor = vec4(color * ambientOcclusion, 1.0 - vHeightFactor * 0.5);
      }
    `
  }), []);

  // Initialize instance matrices
  useMemo(() => {
    const dummy = new THREE.Object3D();
    return [...Array(SHELL_COUNT)].map((_, i) => {
      dummy.position.set(0, 0, 0);
      dummy.updateMatrix();
      return dummy.matrix.clone();
    });
  }, []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <group position={[0, -4, -40]}>
      {/* The main shell mesh */}
      <instancedMesh ref={meshRef} args={[geometry, material, SHELL_COUNT]}>
        {/* Fill the instance matrices with identity matrices */}
        {useMemo(() => {
          const array = new Float32Array(SHELL_COUNT * 16);
          for (let i = 0; i < SHELL_COUNT; i++) {
            const mat = new THREE.Matrix4();
            mat.toArray(array, i * 16);
          }
          return array;
        }, []).map((val, i) => null)}
      </instancedMesh>
      
      {/* A solid base layer so you don't see through the hills */}
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#050a01" />
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
    const targetPos = new THREE.Vector3(-15, 1.5, 30);
    camera.position.lerp(isHome ? targetPos : new THREE.Vector3(-8, 1.5, -100), 0.04);
    camera.lookAt(lookAtTarget.current);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      <VolumetricMoss />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 500]} />
      <hemisphereLight intensity={2.5} color="#ffffff" groundColor="#ffc0e6" />
      
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
          distortionScale: 3.7,
          alpha: 0.8,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}