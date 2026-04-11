import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

// 1. SHARED GEOMETRY FUNCTION
// Defined outside components to prevent "ReferenceError: hillGeom is not defined"
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
  const g = new THREE.PlaneGeometry(500, 500, 100, 100);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) {
    pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
  }
  g.computeVertexNormals();
  return g;
};

// 2. STYLIZED CANDY CORAL COMPONENT
const CandyCoralReef = () => {
  const meshRef = useRef();
  const COUNT = 180; 
  const hillGeom = useMemo(() => createHillGeom(), []);
  const coralGeom = useMemo(() => {
    const g = new THREE.CapsuleGeometry(1, 4, 16, 32);
    g.translate(0, 2, 0); 
    return g;
  }, []);

  const dummy = new THREE.Object3D();
  
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 420;
      const z = (Math.random() - 0.5) * 420;
      const y = getHillHeight(x, z);
      dummy.position.set(x, y - 0.5, z);
      dummy.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
      const s = 0.8 + Math.pow(Math.random(), 3) * 15; 
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const coralMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColorPink: { value: new THREE.Color("#ff779b") },
      uColorYellow: { value: new THREE.Color("#ffea00") },
      uLightDir: { value: new THREE.Vector3(-15, 30, 10).normalize() },
      uColorGlow: { value: new THREE.Color("#ffc0e6") }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
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
        float mixRatio = clamp(vPosition.y / 4.0, 0.0, 1.0);
        vec3 candyColor = mix(uColorYellow, uColorPink, mixRatio);
        float diffuse = max(dot(uLightDir, vNormal), 0.2);
        float rim = pow(1.0 - max(dot(vNormal, vec3(0,0,1)), 0.0), 3.0);
        gl_FragColor = vec4((candyColor * diffuse) + (uColorGlow * rim * 0.5), 1.0);
      }
    `
  }), []);

  return (
    <group position={[0, -4, -40]}>
      <mesh geometry={hillGeom}>
        <meshStandardMaterial color="#010300" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[coralGeom, coralMaterial, COUNT]} />
    </group>
  );
};

// 3. MAIN SCENE
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const exitPos = new THREE.Vector3(-8, 1.5, -100);
    camera.position.lerp(isHome ? targetPos : exitPos, 0.04);
    camera.lookAt(lookAtTarget.current);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={5} rayleigh={1} />
      <CandyCoralReef />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 400]} />
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