import { useRef, useMemo, useEffect } from "react";
import { useFrame, extend, useLoader } from "@react-three/fiber";
import { Sky, Cloud, Environment } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

extend({ Water });

// --- SHADER FOR FLUID MOVEMENT ---
const coralShader = {
  uniforms: { time: { value: 0 } },
  vertexShader: `
    varying float vHeight;
    uniform float time;
    void main() {
      vHeight = position.y;
      vec3 pos = position;
      float sway = sin(time * 1.5 + (instanceMatrix[3][0] * 0.3)) * (vHeight * 0.25);
      pos.x += sway;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying float vHeight;
    void main() {
      vec3 bottom = vec3(0.05, 0.15, 0.05);
      vec3 top = vec3(0.5, 0.8, 0.2);
      gl_FragColor = vec4(mix(bottom, top, vHeight), 1.0);
    }
  `
};

const CoralInstances = ({ count, hillGeom, isFiller = false }) => {
  const meshRef = useRef();
  
  // Create a thick "Hex-Cross" for maximum volume
  const geom = useMemo(() => {
    const w = isFiller ? 0.6 : 0.25;
    const h = isFiller ? 0.4 : 1.3;
    const base = new THREE.PlaneGeometry(w, h, 1, 2);
    base.translate(0, h / 2, 0);
    const planes = [base.clone(), base.clone().rotateY(Math.PI / 3), base.clone().rotateY(Math.PI / 1.5)];
    return BufferGeometryUtils.mergeGeometries(planes);
  }, [isFiller]);

  const positions = hillGeom.attributes.position.array;
  const dummy = new THREE.Object3D();

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * (positions.length / 3)) * 3;
      const x = positions[idx] + (Math.random() - 0.5) * 4; 
      const z = positions[idx + 1] + (Math.random() - 0.5) * 4;
      const y = positions[idx + 2]; // This is the Z-value of the PlaneGeom (the height)

      const dist = Math.sqrt(x * x + z * z);
      if (dist < 48) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(x, y - 0.1, z);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.scale.setScalar(0.7 + Math.random() * 0.8);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions]);

  useFrame((state) => {
    meshRef.current.material.uniforms.time.value = state.clock.getElapsedTime();
  });

  return (
    <instancedMesh ref={meshRef} args={[geom, null, count]}>
      <shaderMaterial attach="material" {...coralShader} side={THREE.DoubleSide} />
    </instancedMesh>
  );
};

const GrassyHills = () => {
  const hillGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(450, 450, 120, 120);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i + 1];
      const d = Math.sqrt(x * x + y * y);
      const mask = d < 45 ? 0 : Math.min(1, (d - 45) / 30);
      pos[i + 2] = (Math.sin(x * 0.05) * Math.cos(y * 0.05) * 12) * mask;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, 0]}>
      <mesh geometry={hillGeom}>
        <meshStandardMaterial color="#1a2e0a" />
      </mesh>
      {/* Tall Coral Layer */}
      <CoralInstances count={90000} hillGeom={hillGeom} />
      {/* Short Thick Filler Layer */}
      <CoralInstances count={60000} hillGeom={hillGeom} isFiller />
    </group>
  );
};

export default function Scene() {
  const waterRef = useRef();
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useFrame((_, delta) => {
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 2, -100]} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 10, 350]} />
      
      <GrassyHills />

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(4000, 4000), {
          textureWidth: 512, textureHeight: 512, waterNormals,
          sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
          sunColor: 0xffffff, waterColor: 0x224455, distortionScale: 0.5,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
      
      {/* Sun/Light Orb */}
      <mesh position={[-10, 55, -200]}>
        <sphereGeometry args={[22]} />
        <meshStandardMaterial color="#fff4e6" emissive="#ffba5c" emissiveIntensity={2} />
      </mesh>

      <hemisphereLight intensity={1.2} color="#ffffff" groundColor="#ffc0e6" />
    </>
  );
}