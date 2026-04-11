import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

// 1. Terrain logic must be consistent for placement
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / smoothZone, 1.0);
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const DenseBlenderField = () => {
  const meshRef = useRef();
  // We use 120k instances, but each instance is a 'cluster' of 5 blades 
  // to reach the 'millions' look visually.
  const instanceCount = 120000; 

  const [bladeGeo, material] = useMemo(() => {
    // Low-poly blade to save memory
    const geo = new THREE.PlaneGeometry(0.1, 0.7, 1, 2);
    geo.translate(0, 0.35, 0);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorBase: { value: new THREE.Color("#0d1a01") },
        uColorTip: { value: new THREE.Color("#8cb32d") },
      },
      vertexShader: `
        varying float vHeightFactor;
        uniform float uTime;

        // Simple noise for wind
        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        void main() {
          vHeightFactor = position.y / 0.7;
          
          // Get instance position
          vec3 worldPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          
          // Wind: Combined noise waves
          float wind = sin(uTime * 1.5 + worldPos.x * 0.1 + worldPos.z * 0.1) * 0.4;
          wind += sin(uTime * 4.0 + worldPos.x) * 0.05;

          vec3 pos = position;
          pos.x += wind * vHeightFactor;
          pos.z += wind * 0.5 * vHeightFactor;

          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vHeightFactor;
        uniform vec3 uColorBase;
        uniform vec3 uColorTip;

        void main() {
          // Deep roots to bright tips
          vec3 color = mix(uColorBase, uColorTip, vHeightFactor);
          // Darken the base for fake Ambient Occlusion
          float shadow = pow(vHeightFactor, 0.5);
          gl_FragColor = vec4(color * shadow, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
    return [geo, mat];
  }, []);

  // One-time setup for the million-blade scatter
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < instanceCount; i++) {
        // Spread across the 650x650 field
        const x = (Math.random() - 0.5) * 620;
        const z = (Math.random() - 0.5) * 620;
        const y = getHillHeight(x, z);

        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI;
        // Jitter the lean for organic clump look
        dummy.rotation.x = (Math.random() - 0.5) * 0.5; 
        dummy.scale.setScalar(0.4 + Math.random() * 0.9);
        
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
      args={[bladeGeo, material, instanceCount]} 
      position={[0, -4.1, -40]} 
    />
  );
};