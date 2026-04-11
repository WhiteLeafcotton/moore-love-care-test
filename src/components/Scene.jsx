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

const VolumetricMossHills = () => {
  const SHELL_COUNT = 15; // Number of "layers" to create depth
  const meshRef = useRef();

  // Create the base geometry once
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(650, 650, 128, 128);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // Custom shader for the "shells"
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorDark: { value: new THREE.Color("#0d1a01") },
      uColorLight: { value: new THREE.Color("#99cc33") },
      uShellCount: { value: SHELL_COUNT }
    },
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeightFactor;
      uniform float uShellCount;
      attribute float shellIndex; // Custom attribute for which layer this is

      void main() {
        vUv = uv;
        // Move each shell upwards based on its index
        float h = (shellIndex / uShellCount) * 2.5; 
        vHeightFactor = shellIndex / uShellCount;
        
        vec3 pos = position;
        pos.y += h; // Displace layer upwards
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeightFactor;
      uniform vec3 uColorDark;
      uniform vec3 uColorLight;

      // Noise function to create the "blades" or "pores"
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        // Create a pattern of "holes" that gets thinner as we go up
        float noise = hash(vUv * 1200.0);
        if (noise < vHeightFactor) discard;

        // Darker at the bottom, lighter at the tips
        vec3 color = mix(uColorDark, uColorLight, vHeightFactor);
        
        // Simple top-down shadowing
        float alpha = 1.0 - vHeightFactor;
        gl_FragColor = vec4(color, alpha + 0.2);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  return (
    <group position={[0, -4, -40]}>
      {/* Build 15 layers of the hill */}
      {[...Array(SHELL_COUNT)].map((_, i) => (
        <mesh key={i} geometry={geometry}>
          <primitive object={material} attach="material" />
          {/* We pass the index to the shader to handle the height offset */}
          <onBeforeRender onBeforeRender={(renderer, scene, camera, geometry) => {
             material.uniforms.uTime.value = performance.now() / 1000;
          }} />
        </mesh>
      ))}
      {/* Dark ground filler to hide gaps */}
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
      <VolumetricMossHills />
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