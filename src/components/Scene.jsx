import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

// 1. Terrain Height Logic
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const smoothZone = 25;
  let influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / smoothZone, 1.0);
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const BlenderRealismGrass = () => {
  const meshRef = useRef();
  const count = 80000; // High density is key for the "thick" look

  // 2. Create a "Curved" Blade (More realistic than a flat plane)
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.12, 1.0, 1, 4);
    g.translate(0, 0.5, 0); // Bottom at origin
    
    // Curve the blade vertices slightly for a non-digital look
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const h = pos[i + 1];
      pos[i] += Math.pow(h, 2) * 0.2; // Curve on X
      pos[i + 2] += Math.pow(h, 2) * 0.1; // Curve on Z
    }
    return g;
  }, []);

  // 3. The "Cycles-Style" Shader
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorBase: { value: new THREE.Color("#0d1a01") }, // Almost black-green roots
      uColorMid: { value: new THREE.Color("#3a5a2a") },
      uColorTip: { value: new THREE.Color("#8cb32d") }  // Sun-kissed tips
    },
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      uniform float uTime;

      void main() {
        vUv = uv;
        vHeight = position.y;
        
        // Extract instance position from matrix
        vec3 worldPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        
        // Wind math: Large waves + Micro shivers
        float wind = sin(uTime * 0.8 + worldPos.x * 0.05 + worldPos.z * 0.05) * 0.3;
        wind += sin(uTime * 2.0 + worldPos.x * 0.5) * 0.05;
        
        vec3 pos = position;
        pos.x += wind * vHeight; // Tips move more than base
        pos.z += wind * 0.5 * vHeight;

        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeight;
      uniform vec3 uColorBase;
      uniform vec3 uColorMid;
      uniform vec3 uColorTip;

      void main() {
        // Create a 3-way gradient for more organic depth
        vec3 color = vHeight < 0.5 
          ? mix(uColorBase, uColorMid, vHeight * 2.0) 
          : mix(uColorMid, uColorTip, (vHeight - 0.5) * 2.0);
          
        // Ambient Occlusion: Darken the very bottom significantly
        float ao = pow(vHeight, 0.4); 
        
        gl_FragColor = vec4(color * ao, 1.0);
      }
    `
  }), []);

  // 4. Initial Placement
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    
    if (meshRef.current && !meshRef.current._setup) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 580;
        const z = (Math.random() - 0.5) * 580;
        const y = getHillHeight(x, z);
        
        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI;
        // Randomize lean
        dummy.rotation.x = (Math.random() - 0.5) * 0.4;
        dummy.scale.setScalar(0.5 + Math.random() * 1.2);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._setup = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[bladeGeo, material, count]} position={[0, -4.1, -40]} />
  );
};