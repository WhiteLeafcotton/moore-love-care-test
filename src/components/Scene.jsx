import { useRef, useMemo, useEffect, useState } from "react";
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

// --- CHARACTERS ---
const BlockHumanoid = ({ scale = 1, materialProps, poseProps = {} }) => {
  const { 
    leftLegRotation = [0, 0, 0], 
    rightLegRotation = [0, 0, 0], 
    // FIXED: Default arm rotations brought forward and relaxed
    leftArmRotation = [0.15, 0, -0.05], 
    rightArmRotation = [0.15, 0, 0.05], 
    position = [0,0,0], 
    rotation = [0,0,0], 
    cane = false,
    isLeaning = false,
    isWalking = false,
    isTalking = false,
    walkSpeed = 8,
    headRotationY = 0
  } = poseProps;
  
  const torsoRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const headRef = useRef();

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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // NEW: Candid Gesturing & Head Tilt
    if (isTalking) {
      const gesture = Math.sin(t * 2) * 0.15;
      const nod = Math.cos(t * 1.5) * 0.05;
      if (headRef.current) {
        headRef.current.rotation.y = headRotationY + gesture * 0.5;
        headRef.current.rotation.x = nod;
      }
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0.3 + gesture;
      if (leftArmRef.current) leftArmRef.current.rotation.z = -0.1 + Math.sin(t) * 0.05;
    }

    if (isWalking) {
      const swing = Math.sin(t * walkSpeed) * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.5;
    } else if (!isTalking) {
        if (leftLegRef.current) leftLegRef.current.rotation.x = leftLegRotation[0];
        if (rightLegRef.current) rightLegRef.current.rotation.x = rightLegRotation[0];
        if (leftArmRef.current) leftArmRef.current.rotation.x = leftArmRotation[0];
        if (rightArmRef.current) rightArmRef.current.rotation.x = rightArmRotation[0];
    }
  });

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <group ref={torsoRef}>
        <mesh ref={headRef} position={[0, 1.4, 0]} castShadow><sphereGeometry args={[0.22, 32, 32]} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0, 0.3, 0]} castShadow><primitive object={torsoGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        <group position={[0, 1.2, 0]}>
          <group ref={leftArmRef} position={[-0.22, 0, 0]} rotation={leftArmRotation}>
            <mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh>
          </group>
          <group ref={rightArmRef} position={[0.22, 0, 0]} rotation={rightArmRotation}>
            <mesh castShadow>
                <primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
                {cane && <mesh position={[0, -0.7, 0.1]}><cylinderGeometry args={[0.015, 0.015, 1.1]} /><meshStandardMaterial color="#fcd7d7" /></mesh>}
            </mesh>
          </group>
        </group>
      </group>
      <group position={[0, 0.4, 0]}>
        <group ref={leftLegRef} position={[-0.12, 0, 0]} rotation={leftLegRotation}>
          <mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        </group>
        <group ref={rightLegRef} position={[0.12, 0, 0]} rotation={rightLegRotation}>
          <mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        </group>
      </group>
    </group>
  );
};

// --- ENVIRONMENT ---
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
    uniforms: { uTime: { value: 0 }, uColorRoots: { value: new THREE.Color("#13051a") }, uColorTips: { value: new THREE.Color("#c292f5") } },
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
      <mesh geometry={terrainGeo} receiveShadow><meshStandardMaterial color="#0c020f" roughness={1} /></mesh>
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
            <boxGeometry args={[width, stepHeight, stepDepth]} /><meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} /><meshStandardMaterial {...materialProps} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

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

// --- ANIMATED CHAPTERS ---
const WalkingToConversationChapter = ({ butterProps }) => {
  const groupRef = useRef();
  const [phase, setPhase] = useState("walking");

  useFrame((state) => {
    const t = Math.min(state.clock.elapsedTime / 15, 1);
    const progress = THREE.MathUtils.smoothstep(t, 0, 1);
    if (phase === "walking") {
      groupRef.current.position.z = 4.0 + (18.0 - 4.0) * progress;
      if (t >= 1) setPhase("talking");
    }
  });

  return (
    <group ref={groupRef} position={[7.5, 1.9, 4.0]} rotation={[0, Math.PI / 2, 0]}>
        <BlockHumanoid 
          scale={0.95} 
          materialProps={butterProps} 
          poseProps={{ 
            isWalking: phase === "walking", 
            isTalking: phase === "talking",
            walkSpeed: 3.5, 
            cane: true, 
            rotation: [0, 0.45, 0], // Inward turn
            position: [-0.3, 0, 0],
            headRotationY: -0.8
          }} 
        />
        <group position={[0.5, 0, 0]}>
          <BlockHumanoid 
            scale={0.95} 
            materialProps={butterProps} 
            poseProps={{ 
              isWalking: phase === "walking", 
              isTalking: phase === "talking",
              walkSpeed: 3.5,
              rotation: [0, -0.45, 0], // Inward turn
              headRotationY: 0.8
            }} 
          />
        </group>
    </group>
  );
};

// --- MAIN SCENE ---
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  useEffect(() => { if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    // MOBILE ZOOM FIXED: Moved from Z: 10 to Z: 6.5 for "in your face" framing
    const targetPos = isHome 
        ? (isMobile ? new THREE.Vector3(-30, 1.1, 6.5) : new THREE.Vector3(-14, 3.2, 24)) 
        : new THREE.Vector3(-24.5, 3.5, -450);
    
    // Tilted camera up more on mobile to frame the massive architecture
    const targetLookAt = isHome 
        ? (isMobile ? new THREE.Vector3(10, 3.2, 6.5) : new THREE.Vector3(20, 1.2, -2)) 
        : new THREE.Vector3(-24.5, 1.5, -1000);

    camera.position.lerp(targetPos, 0.04);
    camera.lookAt(targetLookAt);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
  });

  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <GrassySassyHills />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow />

      <group position={[0, 0, 0]}>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow>
          <boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} />
        </mesh>
        
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />

        {/* RESTORED & EXTENDED STRUCTURE: No more mobile clipping */}
        <group position={[-16, -1.6, 0]}>
          <mesh position={[1, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={butterProps} />
          <WallOpening position={[12, 0, 0]} colorProps={butterProps} />
          <mesh position={[24, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          {/* Extension wall to ensure mobile screen is always filled */}
          <mesh position={[45, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[24, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        <group position={[17, -1.6, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[0.5, 8.5, 0]}><boxGeometry args={[1, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={butterProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={butterProps} />
          <mesh castShadow receiveShadow position={[30, 8.5, 0]}><boxGeometry args={[20, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        <WalkingToConversationChapter butterProps={butterProps} />
      </group>

      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), sunColor: 0xffffff, waterColor: 0x21162e, distortionScale: 1.0, alpha: 0.95 }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.45, 0]}
      />
    </>
  );
}