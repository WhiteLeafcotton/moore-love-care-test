import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000;

const getHillHeight = (x, z) => {
  const dist = Math.sqrt(x * x + z * z);
  const flatZone = 45; 
  const influence = dist < flatZone ? 0 : Math.min((dist - flatZone) / 25, 1.0);
  const hills = [
    { x: 20, z: -100, h: 18, w: 16 },    
    { x: -70, z: -50, h: 12, w: 12 },    
    { x: 55, z: -40, h: 14, w: 14 }     
  ];
  let hillHeight = 0;
  hills.forEach(h => {
    const d = Math.sqrt(Math.pow(x - h.x, 2) + Math.pow(z - h.z, 2));
    hillHeight += Math.exp(-Math.pow(d / h.w, 2)) * h.h;
  });
  return hillHeight * influence;
};

// --- GRASS ---
const GrassySassyHills = () => {
  const meshRef = useRef();
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.05, 1.2, 1, 4);
    g.translate(0, 0.6, 0);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const h = pos[i + 1] / 1.2;
      pos[i] += Math.pow(h, 2) * 0.15; 
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = getHillHeight(pos[i], pos[i + 2]);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const grassMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorRoots: { value: new THREE.Color("#13051a") }, 
      uColorTips: { value: new THREE.Color("#c292f5") }  
    },
    vertexShader: `
      varying float vHeight;
      uniform float uTime;
      void main() {
        vHeight = position.y / 1.2;
        vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float swell = sin(uTime * 0.5 + worldPos.x * 0.05 + worldPos.z * 0.05) * 0.3;
        float gust = sin(uTime * 2.0 + worldPos.x * 0.2) * 0.15;
        float totalWind = (swell + gust) * vHeight;
        vec3 pos = position;
        pos.x += totalWind;
        pos.z += totalWind * 0.3;
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
    grassMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        const y = getHillHeight(x, z);
        if (y > 0.05) {
          dummy.position.set(x, y - 0.05, z);
          dummy.rotation.y = Math.random() * Math.PI;
          dummy.scale.setScalar(0.6 + Math.random() * 0.8);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current._init = true;
    }
  });

  return (
    <group position={[0, -3.5, -40]}>
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial color="#0c020f" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[bladeGeo, grassMaterial, GRASS_COUNT]} castShadow />
    </group>
  );
};

// --- ARCHITECTURE ---
const Staircase = ({ position, width, rotation, materialProps }) => {
  const stepHeight = 0.5; const stepDepth = 0.8; const numSteps = 16;
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <group key={i} position={[0, -i * stepHeight, i * stepDepth]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, stepHeight, stepDepth]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Bench = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 0.1, 1.2]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
    <mesh position={[0, 1, -0.55]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 1, 0.1]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
    {[[-1.3, 0, 0.45], [1.3, 0, 0.45], [-1.3, 0, -0.45], [1.3, 0, -0.45]].map((pos, i) => (
      <mesh key={i} position={[pos[0], 0.225, pos[2]]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    ))}
  </group>
);

const WallOpening = ({ position, colorProps, width = 6, openingW = 4.8, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} /><meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[openingW, 4, 2]} /><meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

// --- RESTORED CHARACTERS ---
const BlockHumanoid = ({ scale = 1, materialProps, poseProps = {} }) => {
  const { 
    leftLegRotation = [0, 0, 0], 
    rightLegRotation = [0, 0, 0], 
    leftArmRotation = [0.2, 0, -0.1], 
    rightArmRotation = [0.2, 0, 0.1], 
    position = [0,0,0], 
    rotation = [0,0,0], 
    cane = false 
  } = poseProps;
  
  const limbGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.08, 0.05), new THREE.Vector2(0.08, 0.75), new THREE.Vector2(0, 0.8)];
    const g = new THREE.LatheGeometry(pts, 32);
    g.translate(0, -0.8, 0); 
    return g;
  }, []);

  const torsoGeo = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.18, 0.1), new THREE.Vector2(0.18, 0.9), new THREE.Vector2(0, 1.0)];
    return new THREE.LatheGeometry(pts, 32);
  }, []);

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <mesh position={[0, 1.4, 0]} castShadow><sphereGeometry args={[0.22, 32, 32]} /><meshStandardMaterial {...materialProps} /></mesh>
      <mesh position={[0, 0.3, 0]} castShadow><primitive object={torsoGeo} /><meshStandardMaterial {...materialProps} /></mesh>
      
      <group position={[0, 0.4, 0]}>
        <group position={[-0.12, 0, 0]} rotation={leftLegRotation}>
          <mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        </group>
        <group position={[0.12, 0, 0]} rotation={rightLegRotation}>
          <mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        </group>
      </group>

      <group position={[0, 1.2, 0]}>
        <mesh position={[-0.22, 0, 0]} rotation={leftArmRotation} castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0.22, 0, 0]} rotation={rightArmRotation} castShadow>
          <primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
          {cane && <mesh position={[0, -0.7, 0.1]}><cylinderGeometry args={[0.015, 0.015, 1.1]} /><meshStandardMaterial color="#fcd7d7" /></mesh>}
        </mesh>
      </group>
    </group>
  );
};

const SimpleWheelchair = ({ materialProps }) => (
  <group>
    <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.6, 0.08, 0.6]} /><meshStandardMaterial color="#fce4e4" /></mesh>
    <mesh position={[0, 0.9, -0.25]} rotation={[0.1, 0, 0]} castShadow><boxGeometry args={[0.55, 0.7, 0.08]} /><meshStandardMaterial color="#fce4e4" /></mesh>
    <group position={[0, 0.45, -0.05]}>
      <mesh position={[-0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.04, 16, 50]} /><meshStandardMaterial color="#2d1d3d" /></mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.04, 16, 50]} /><meshStandardMaterial color="#2d1d3d" /></mesh>
    </group>
  </group>
);

// --- MAIN SCENE ---
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const isMobile = size.width < 768;

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  useEffect(() => { waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = isHome ? 0.04 : 0.018; 
    const homePos = isMobile ? new THREE.Vector3(-18, 12, 32) : new THREE.Vector3(-14, 3.2, 24); 
    const targetPos = isHome ? homePos : new THREE.Vector3(-24.5, 3.5, -450);
    
    camera.position.lerp(targetPos, LERP_SPEED);
    lookAtTarget.current.lerp(isHome ? new THREE.Vector3(20, 1.2, -2) : new THREE.Vector3(-24.5, 1.5, -1000), LERP_SPEED);
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.3;
      if (cloudGroupRef.current.position.x > 500) cloudGroupRef.current.position.x = -500;
    }
  });

  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} turbidity={8} rayleigh={6} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#f8e1ff", 10, 400]} />
      <GrassySassyHills />
      <hemisphereLight intensity={1.4} color="#ffffff" groundColor="#b066ff" />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />

      <group ref={cloudGroupRef}>
        <Cloud position={[0, 80, -450]} speed={0.2} opacity={0.3} segments={40} bounds={[1000, 100, 50]} volume={150} color="#ffd1dc" />
      </group>

      <group position={[0, 0, 0]}>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow>
          <boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} />
        </mesh>
        
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />
        
        <group position={[-16, -1.6, 0]}>
          <mesh position={[1, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={butterProps} />
          <WallOpening position={[12, 0, 0]} colorProps={butterProps} />
          <mesh position={[24, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        <group position={[17, -1.6, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[0.5, 8.5, 0]}><boxGeometry args={[1, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <mesh castShadow receiveShadow position={[4, 8.5, 0]}><boxGeometry args={[6, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={butterProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={butterProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        {/* RESTORED COMMUNITY PLACEMENT */}
        <group>
          {/* Siting on Bench */}
          <group position={[14, 1.9, 4]} rotation={[0, -Math.PI / 2, 0]}>
            <Bench materialProps={butterProps} />
          </group>

          {/* Walking Pair */}
          <group position={[14, 1.9, 12]} rotation={[0, -Math.PI * 0.7, 0]}>
            <BlockHumanoid scale={1} materialProps={butterProps} poseProps={{ cane: true, leftLegRotation: [0.3, 0, 0], rightLegRotation: [-0.3, 0, 0], position: [-0.3, 0, 0]}} />
            <BlockHumanoid scale={0.9} materialProps={butterProps} poseProps={{ leftLegRotation: [-0.3, 0, 0], rightLegRotation: [0.3, 0, 0], position: [0.4, 0, -0.1]}} />
          </group>

          {/* Seated Pair on Edge */}
          <group position={[6.0, 1.6, 11.5]} rotation={[0, Math.PI / 2, 0]}>
            <BlockHumanoid scale={0.9} materialProps={butterProps} poseProps={{ leftLegRotation: [Math.PI / 2, 0, 0], rightLegRotation: [Math.PI / 2, 0, 0], position: [-0.2, 0, 0]}} />
            <BlockHumanoid scale={0.88} materialProps={butterProps} poseProps={{ leftLegRotation: [Math.PI / 2, 0, 0], rightLegRotation: [Math.PI / 2, 0, 0], position: [0.5, 0, 0]}} />
          </group>

          {/* Wheelchair Group */}
          <group position={[14.5, 1.9, 17.5]} rotation={[0, Math.PI, 0]}>
            <SimpleWheelchair materialProps={butterProps} />
            <group position={[0, 0.2, 0]}>
              <BlockHumanoid scale={0.85} materialProps={butterProps} poseProps={{ rotation: [0, Math.PI, 0], leftLegRotation: [Math.PI / 2, 0, 0], rightLegRotation: [Math.PI / 2, 0, 0], leftArmRotation: [0.7, 0, 0], rightArmRotation: [0.7, 0, 0]}} />
            </group>
            <group position={[0, 0, -0.7]}>
              <BlockHumanoid scale={0.95} materialProps={butterProps} poseProps={{ leftArmRotation: [-1.1, 0, 0], rightArmRotation: [-1.1, 0, 0]}} />
            </group>
          </group>
        </group>
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), {
          waterNormals,
          sunDirection: new THREE.Vector3(-10, 10, -100).normalize(),
          sunColor: 0xffffff,
          waterColor: 0x21162e, 
          distortionScale: 1.0,
          alpha: 0.95,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.45, 0]}
      />
    </>
  );
}