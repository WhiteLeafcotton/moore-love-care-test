import { useRef, useMemo } from "react";
import { useFrame, extend, useLoader } from "@react-three/fiber";
import * as THREE from "three";

// Hill height logic stays consistent for the "blanket" look
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = 1.0;
  if (dist < flatZone) influence = 0;
  else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const SandHills = () => {
  const meshRef = useRef();
  
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(650, 650, 256, 256); // High segments for smooth ripples
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const sandMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSandColor: { value: new THREE.Color("#fceabb") }, // Warm premium sand
      uShadowColor: { value: new THREE.Color("#d4a373") },
      uLightDir: { value: new THREE.Vector3(-10, 20, 10).normalize() }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSandColor;
      uniform vec3 uShadowColor;
      uniform vec3 uLightDir;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      // Simple noise for grain
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        float diffuse = max(dot(vNormal, uLightDir), 0.0);
        
        // Add subtle ripples based on UV
        float ripples = sin(vUv.x * 100.0 + vUv.y * 50.0) * 0.05;
        
        // Add "Sparkle" grain
        float grain = hash(vUv * 1000.0);
        float sparkle = pow(grain, 50.0) * 2.0; // Sharp, tiny glints

        vec3 color = mix(uShadowColor, uSandColor, diffuse + ripples);
        color += sparkle * diffuse; // Sparkle only in light

        gl_FragColor = vec4(color, 1.0);
      }
    `
  }), []);

  useFrame((state) => {
    sandMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={sandMaterial} position={[0, -4, -40]} />
  );
};