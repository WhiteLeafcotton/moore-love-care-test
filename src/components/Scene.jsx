import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Sky, Cloud, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000;

/* ---------- TERRAIN ---------- */
const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 65;
  const influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / 40, 1);

  const hills = [
    { x: 0, z: -140, h: 18, w: 50 },
    { x: -100, z: -80, h: 12, w: 40 },
    { x: 110, z: -90, h: 14, w: 45 }
  ];

  let h = 0;
  hills.forEach(k => {
    const d = Math.sqrt((x - k.x) ** 2 + (z - k.z) ** 2);
    h += Math.exp(-(d / k.w) ** 2) * k.h;
  });

  return h * influence;
};

/* ---------- GRASS ---------- */
const Grass = () => {
  const meshRef = useRef();

  const blade = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.04, 1.2, 1, 4);
    g.translate(0, 0.6, 0);
    return g;
  }, []);

  const terrain = useMemo(() => {
    const g = new THREE.PlaneGeometry(500, 500, 160, 160);
    g.rotateX(-Math.PI / 2);

    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }

    g.computeVertexNormals();
    return g;
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRoot: { value: new THREE.Color("#140018") },
      uTip: { value: new THREE.Color("#ff8cf5") }
    },
    vertexShader: `
      varying float vH;
      uniform float uTime;
      void main() {
        vH = position.y / 1.2;

        vec3 pos = position;
        float wind =
          sin(uTime * 1.5 + pos.x * 0.5) * 0.15 +
          sin(uTime * 3.0 + pos.z * 0.8) * 0.08;

        pos.x += wind * vH;

        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos,1.0);
      }
    `,
    fragmentShader: `
      varying float vH;
      uniform vec3 uRoot;
      uniform vec3 uTip;
      void main() {
        vec3 col = mix(uRoot, uTip, vH);
        float depth = pow(vH,0.5);
        gl_FragColor = vec4(col * depth,1.0);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();

    if (meshRef.current && !meshRef.current._done) {
      const dummy = new THREE.Object3D();

      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 500;
        const z = (Math.random() - 0.5) * 500;
        const y = getHillHeight(x, z);

        if (y > 0.05) {
          dummy.position.set(x, y, z);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.scale.setScalar(0.6 + Math.random() * 0.8);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._done = true;
    }
  });

  return (
    <group position={[0, -3.5, -20]}>
      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial color="#07020a" roughness={1} />
      </mesh>

      <instancedMesh ref={meshRef} args={[blade, material, GRASS_COUNT]} />
    </group>
  );
};

/* ---------- MAIN SCENE ---------- */
export default function Scene({ currentView }) {
  const { camera } = useThree();

  const transition = useRef(0);
  const fromPos = useRef(new THREE.Vector3());
  const toPos = useRef(new THREE.Vector3());
  const fromLook = useRef(new THREE.Vector3());
  const toLook = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    transition.current = 0;

    fromPos.current.copy(camera.position);
    fromLook.current.copy(lookAt.current);

    if (currentView === "home") {
      toPos.current.set(10, 7, 24);
      toLook.current.set(12, 4, 15);
    } else {
      toPos.current.set(0, 10, 90); // OPEN SPACE
      toLook.current.set(12, 3, 10);
    }
  }, [currentView]);

  useFrame(() => {
    if (transition.current < 1) {
      transition.current += 0.02;

      const t = transition.current;
      const ease = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const pos = new THREE.Vector3().lerpVectors(fromPos.current, toPos.current, ease);
      const look = new THREE.Vector3().lerpVectors(fromLook.current, toLook.current, ease);

      camera.position.copy(pos);
      lookAt.current.copy(look);
      camera.lookAt(lookAt.current);
    }
  });

  return (
    <>
      {/* SKY (no globe sun) */}
      <Sky sunPosition={[50, 40, -200]} turbidity={6} rayleigh={3} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#f5b0ff", 30, 300]} />

      <Grass />

      {/* LIGHTING */}
      <hemisphereLight intensity={1.2} />
      <directionalLight position={[50, 40, -200]} intensity={1.2} castShadow />

      {/* CLOUD */}
      <Cloud position={[0, 60, -200]} opacity={0.3} speed={0.2} />

      {/* SHADOW */}
      <ContactShadows position={[12, -2, 15]} opacity={0.2} scale={50} blur={4} />
    </>
  );
}