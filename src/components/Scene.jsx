import { useRef, useMemo } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

extend({ Water });

const INSTANCE_COUNT = 150000; // 150k clumps = ~2.25M blades

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  let influence = dist < 45 ? 0 : Math.min((dist - 45) / 25, 1.0);
  return (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 12 + Math.sin(x * 0.1) * 4) * influence;
};

const BlenderMegaField = () => {
  const meshRef = useRef();

  // 1. GENERATE THE MEGA-CLUMP (15 blades per instance)
  const clumpGeo = useMemo(() => {
    const geometries = [];
    for (let i = 0; i < 15; i++) {
      const g = new THREE.PlaneGeometry(0.06, 0.85, 1, 3);
      g.translate(0, 0.425, 0);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.22;
      g.rotateY(angle);
      g.translate(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      g.rotateX((Math.random() - 0.5) * 0.3);
      geometries.push(g);
    }
    return BufferGeometryUtils.mergeGeometries(geometries);
  }, []);

  // 2. SOLID SOIL MESH (Matches your sanctuary hill logic)
  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(650, 650, 160, 160);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // 3. ADVANCED BLENDER SHADER
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#030801") }, // Deep base for thickness
      uColorTips: { value: new THREE.Color("#a1cc33") }
    },
    vertexShader: `
      varying float vHeight;
      uniform float uTime;
      void main() {
        vHeight = position.y / 0.85;
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float wind = sin(uTime * 1.3 + worldPos.x * 0.08) * 0.22 * vHeight;
        vec3 pos = position;
        pos.x += wind;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vHeight;
      uniform vec3 uColorRoots;
      uniform vec3 uColorTips;
      void main() {
        float ao = pow(vHeight, 0.4); 
        vec3 color = mix(uColorRoots, uColorTips, vHeight);
        gl_FragColor = vec4(color * ao, 1.0);
      }
    `,
    side: THREE.DoubleSide
  }), []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < INSTANCE_COUNT; i++) {
        const x = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 600;
        const y = getHillHeight(x, z);
        dummy.position.set(x, y - 0.05, z);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.scale.setScalar(0.7 + Math.random() * 0.5);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._init = true;
    }
  });

  return (
    <group position={[0, -4.5, -40]}>
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial color="#0a1501" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[clumpGeo, material, INSTANCE_COUNT]} castShadow />
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const target = isHome ? new THREE.Vector3(-15, 6, 35) : new THREE.Vector3(-8, 4, -120);
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, 0, 0);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.15;
  });

  return (
    <>
      <Sky sunPosition={[-10, 5, -100]} turbidity={0.05} rayleigh={1.2} />
      <Environment preset="sunset" />
      <BlenderMegaField />
      <directionalLight position={[30, 50, 10]} intensity={3} castShadow />
      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(5000, 5000), {
          waterNormals: useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg"),
          sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          alpha: 0.8,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}