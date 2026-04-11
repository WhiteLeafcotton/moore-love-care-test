import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 40;
  const smoothZone = 30;
  let influence = 1.0;
  if (dist < flatZone) influence = 0;
  else if (dist < flatZone + smoothZone) influence = (dist - flatZone) / smoothZone;
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const createHillGeom = () => {
  const g = new THREE.PlaneGeometry(600, 600, 128, 128);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) {
    pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
  }
  g.computeVertexNormals();
  return g;
};

const SpaghettiCoralReef = () => {
  const meshRef = useRef();
  // Very high count to create a dense, grassy reef effect
  const COUNT = 3500; 
  const hillGeom = useMemo(() => createHillGeom(), []);
  
  // Adjusted: radius 0.1 and length 6.0 makes them look like thin spaghetti
  const coralGeom = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.1, 6.0, 4, 12);
    g.translate(0, 3, 0); // Keep pivot at the base
    return g;
  }, []);

  const dummy = new THREE.Object3D();
  
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 550;
      const z = (Math.random() - 0.5) * 550;
      const y = getHillHeight(x, z);
      
      dummy.position.set(x, y - 0.1, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      
      // Variations in height
      const s = 0.4 + Math.random() * 1.2; 
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const coralMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorPink: { value: new THREE.Color("#ff779b") },
      uColorYellow: { value: new THREE.Color("#ffea00") },
      uLightDir: { value: new THREE.Vector3(-15, 30, 10).normalize() },
      uColorGlow: { value: new THREE.Color("#ffc0e6") }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        // Higher power on pos.y makes the tips whip more violently like real spaghetti in wind
        float windStrength = pow(pos.y, 2.0) * 0.18;
        float wave = sin(uTime * 2.0 + instanceMatrix[3][0] * 0.5 + instanceMatrix[3][2] * 0.5);
        
        pos.x += wave * windStrength;
        pos.z += cos(uTime * 1.5 + instanceMatrix[3][0]) * (windStrength * 0.5);

        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
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
        // Gradient stretched over the longer body
        float mixRatio = clamp(vPosition.y / 6.0, 0.0, 1.0);
        vec3 candyColor = mix(uColorYellow, uColorPink, mixRatio);
        
        float diffuse = max(dot(uLightDir, vNormal), 0.4);
        float rim = pow(1.0 - max(dot(vNormal, vec3(0,0,1)), 0.0), 4.0);
        
        gl_FragColor = vec4((candyColor * diffuse) + (uColorGlow * rim * 0.6), 1.0);
      }
    `
  }), []);

  useFrame((state) => {
    coralMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <group position={[0, -4, -40]}>
      <mesh geometry={hillGeom}>
        <meshStandardMaterial color="#010300" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[coralGeom, coralMaterial, COUNT]} />
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
    const exitPos = new THREE.Vector3(-8, 1.5, -100);
    camera.position.lerp(isHome ? targetPos : exitPos, 0.04);
    camera.lookAt(lookAtTarget.current);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      <SpaghettiCoralReef />
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