import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// Hill height logic - centered to leave space for the sanctuary
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = 1.0;
  if (dist < flatZone) influence = 0;
  else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const VelvetHills = () => {
  const meshRef = useRef();
  
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(650, 650, 256, 256);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // THE VELVET SHADER
  const velvetMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color("#1a2e05") }, // Deep forest moss
      uFuzzColor: { value: new THREE.Color("#a4cc3d") }, // Vibrant highlight green
      uLightDir: { value: new THREE.Vector3(-10, 20, 10).normalize() }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vViewDir = normalize(cameraPosition - worldPosition.xyz);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uFuzzColor;
      uniform vec3 uLightDir;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;

      void main() {
        // Fresnel Effect: Stronger on the edges (rim lighting)
        float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
        
        // Simple noise for a non-perfect "organic" look
        float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
        
        // Lighting
        float diffuse = max(dot(vNormal, uLightDir), 0.0);
        
        // Mix the deep color with the "fuzzy" edge color
        vec3 finalColor = mix(uBaseColor, uFuzzColor, fresnel + (diffuse * 0.3));
        
        // Add a very subtle organic "grain"
        finalColor += noise * 0.02;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  }), []);

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={velvetMaterial} 
      position={[0, -4, -40]} 
      receiveShadow 
    />
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
    const exitPos = new THREE.Vector3(-8, 1.5, -100);
    camera.position.lerp(isHome ? targetPos : exitPos, 0.04);
    camera.lookAt(lookAtTarget.current);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      
      {/* THE NEW VELVET HILLS */}
      <VelvetHills />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 500]} />
      <hemisphereLight intensity={2.5} color="#ffffff" groundColor="#ffc0e6" />
      
      {/* Central Sanctuary Structure */}
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