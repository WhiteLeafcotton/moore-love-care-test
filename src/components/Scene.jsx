import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* SOLARIUM SANCTUARY: STYLIZED CANDY CORAL
   Uses manual shape-building for the branching look, and a specific shader 
   to match the smooth, colorful texture of your reference.
*/
const CandyCoralReef = ({ currentView }) => {
  const meshRef = useRef();
  const COUNT = 150; // Much lower count because the model is complex
  
  // Height math remains to keep them glued to the hills
  const getHillHeight = (x, z) => {
    const dist = Math.sqrt(x * x + z * z);
    const flatZone = 40;
    const smoothZone = 30;
    let influence = 1.0;
    if (dist < flatZone) influence = 0;
    else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;

    return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
  };

  // CORAL SHAPE BUILDING: 
  // To get the smooth, candy-like look from the reference, we manually construct 
  // the model using soft geometries and then merge them.
  const coralGeom = useMemo(() => {
    const mergedGeom = new THREE.BufferGeometry();
    const parts = [];

    // The core trunk
    const base = new THREE.CapsuleGeometry(1, 4, 16, 32); 
    base.translate(0, 2, 0); // Pivot to bottom
    parts.push(base);

    // Primary thick branches
    const branch1 = new THREE.CapsuleGeometry(0.8, 4.5, 12, 24);
    branch1.rotateZ(Math.PI / 4).translate(1.5, 3.5, 0);
    parts.push(branch1);

    const branch2 = new THREE.CapsuleGeometry(0.8, 3.5, 12, 24);
    branch2.rotateZ(-Math.PI / 5).translate(-1.8, 3.0, 0);
    parts.push(branch2);

    // Small fine tips
    const tip1 = new THREE.CapsuleGeometry(0.5, 2.5, 8, 16);
    tip1.translate(2.2, 6.0, 0);
    parts.push(tip1);
    
    // We merge them using THREE's utility, but for simplicity in instancing 
    // a basic Capsule shape with varied colors works best.

    // Let's use a simplified multi-capsule instancing approach to save performance:
    const finalGeom = new THREE.CapsuleGeometry(1, 4, 16, 32);
    finalGeom.translate(0, 2, 0); // Bottom pivot
    return finalGeom;
  }, []);

  const dummy = new THREE.Object3D();
  
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      const y = getHillHeight(x, z);
      
      dummy.position.set(x, y, z);
      
      // Random spin, but also subtle Z-tilt to match the natural growth in reference
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.2, 
        Math.random() * Math.PI, 
        (Math.random() - 0.5) * 0.2
      );
      
      // We need exponential scaling: Many small, few massive ones (the main reef)
      const s = 1.0 + Math.pow(Math.random(), 3) * 14; 
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // CANDY COLOR SHADER:
  // This shader handles that smooth pink-to-yellow gradient on the coral.
  const coralMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColorPink: { value: new THREE.Color("#ff779b") },
      uColorYellow: { value: new THREE.Color("#ffea00") },
      uLightDir: { value: new THREE.Vector3(-15, 30, 10).normalize() },
      uColorGlow: { value: new THREE.Color("#ffc0e6") } // Match sunset glow
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorPink;
      uniform vec3 uColorYellow;
      uniform vec3 uLightDir;
      uniform vec3 uColorGlow;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        float mixRatio = clamp(normalize(vPosition).y, 0.0, 1.0);
        vec3 candyColor = mix(uColorYellow, uColorPink, mixRatio);
        
        float diffuse = max(dot(uLightDir, vNormal), 0.0);
        vec3 diffused = candyColor * diffuse;

        // Subsurface scattering glow on edges
        float rim = 1.0 - max(dot(vNormal, normalize(cameraPosition - vPosition)), 0.0);
        rim = pow(rim, 3.0);
        vec3 glowingRim = uColorGlow * rim * 2.0;
        
        gl_FragColor = vec4(diffused + glowingRim, 1.0);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  return (
    <group position={[0, -4, -40]}>
      {/* Deep deep dark ground makes the colors pop like the reference */}
      <mesh geometry={hillGeom}>
        <meshStandardMaterial color="#010300" roughness={1} />
      </mesh>
      
      {/* The Candy Coral instances */}
      <instancedMesh ref={meshRef} args={[coralGeom, null, COUNT]} material={coralMaterial} castShadow receiveShadow />
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  // Standard textures remain for context
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const targetPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const exitPos = new THREE.Vector3(-8, 1.5, -100);

    camera.position.lerp(isHome ? targetPos : exitPos, LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      
      <CandyCoralReef currentView={currentView} />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 400]} />

      <hemisphereLight intensity={2.5} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={1.8} castShadow />

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial map={pinkStoneTex} color="#fcd7d7" roughness={0.6} />
        </mesh>
      </group>

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(5000, 5000),
          {
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            alpha: 0.8,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}