import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000;
const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 

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

// --- FURNITURE: LAZY BOY & HOME LAMP ---
const LazyBoyChair = ({ position, rotation }) => (
  <group position={position} rotation={rotation} scale={0.7}>
    {/* Main Seat Cushion */}
    <mesh position={[0, 0.4, 0]} renderOrder={10001}>
      <boxGeometry args={[1.5, 0.8, 1.5]} />
      <meshBasicMaterial color={DARKER_PINK_THEME} depthTest={false} transparent opacity={0.95} />
    </mesh>
    {/* Plush Backrest */}
    <mesh position={[0, 1.2, -0.6]} rotation={[-0.3, 0, 0]} renderOrder={10001}>
      <boxGeometry args={[1.5, 1.6, 0.4]} />
      <meshBasicMaterial color={DARKER_PINK_THEME} depthTest={false} transparent opacity={0.95} />
    </mesh>
    {/* Arms */}
    {[-0.85, 0.85].map((x, i) => (
      <mesh key={i} position={[x, 0.7, 0]} renderOrder={10001}>
        <boxGeometry args={[0.3, 0.6, 1.5]} />
        <meshBasicMaterial color={DARKER_PINK_THEME} depthTest={false} transparent opacity={0.95} />
      </mesh>
    ))}
  </group>
);

const HomeLamp = ({ position }) => (
  <group position={position}>
    {/* Base on platform */}
    <mesh position={[0, 0.05, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
      <meshBasicMaterial color="#333" depthTest={false} />
    </mesh>
    {/* Vertical Pole */}
    <mesh position={[0, 1.5, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.04, 0.04, 3, 16]} />
      <meshBasicMaterial color="#333" depthTest={false} />
    </mesh>
    {/* L-Bend (Vertical section) */}
    <mesh position={[0, 3.1, 0]} renderOrder={10001}>
      <cylinderGeometry args={[0.04, 0.04, 0.2, 16]} />
      <meshBasicMaterial color="#333" depthTest={false} />
    </mesh>
    {/* L-Bend Arm (Horizontal section) */}
    <mesh position={[0.7, 3.2, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={10001}>
      <cylinderGeometry args={[0.04, 0.04, 1.4, 16]} />
      <meshBasicMaterial color="#333" depthTest={false} />
    </mesh>
    {/* Shades & Bulb over Bob's Head */}
    <group position={[1.4, 3.0, 0]} renderOrder={10002}>
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.45, 0.6, 32, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.5} depthTest={false} />
      </mesh>
    </group>
  </group>
);

// --- THE CIRCULAR FLOATING PLATFORM (SANCUTARY) ---
// --- THE CIRCULAR FLOATING PLATFORM (SANCUTARY) ---
// --- THE CIRCULAR FLOATING PLATFORM (SANCUTARY) ---
const FloatingPlatform = ({ butterProps }) => {
  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.5} position={[11, -1.0, 17]}>
      {/* Platform Disk */}
      <mesh renderOrder={10000}>
        <cylinderGeometry args={[4.2, 4.2, 0.25, 64]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} transparent opacity={0.8} />
      </mesh>

      {/* Circle Rug under Chair */}
      <mesh position={[-0.8, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10001}>
        <circleGeometry args={[2.2, 64]} />
        <meshBasicMaterial color={TITLE_PURPLE} depthTest={false} transparent opacity={0.3} />
      </mesh>

      {/* --- LARGER ELEMENTS --- */}

      {/* The Recliner - SCALE INCREASED from 0.7 to 0.9 */}
      <LazyBoyChair position={[-0.8, 0.15, 0]} rotation={[0, Math.PI / 4, 0]} scale={0.9} />

      {/* Seated Resident (Bob) - SCALE INCREASED from 0.8 to 1.0 */}
      <group position={[-0.8, 0.62, 0]} rotation={[0, Math.PI / 4, 0]}>
        <BlockHumanoid 
          scale={1.0} 
          materialProps={{...butterProps, depthTest: false}} 
          poseProps={{ 
            leftLegRotation: [1.5, 0, 0], 
            rightLegRotation: [1.5, 0, 0], 
            torsoRotationX: 0.05 
          }} 
        />
      </group>

      {/* Home Lamp - SCALE INCREASED from 1.0 to 1.2 */}
      {/* (Assuming HomeLamp is defined elsewhere) */}
      <HomeLamp position={[-2.2, 0.14, 0]} scale={1.2} />

      {/* Helper (Standing on Platform) - SCALE INCREASED from 0.92 to 1.15 */}
      {/* Y-position adjusted slightly higher to sit on platform due to scale */}
      <group position={[1.2, 0.2, 0.9]} rotation={[0, -Math.PI / 1.5, 0]}>
        <BlockHumanoid 
          isHelper 
          scale={1.15} 
          materialProps={{...butterProps, depthTest: false}} 
          poseProps={{ 
            headRotationY: -0.4, 
            rightArmRotation: [1.1, 0, -0.3] 
          }} 
        />
      </group>
    </Float>
  );
};
// --- HUMANOID SYSTEM ---
const HeartBadge = () => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0, 0.05, 0.1, 0.1, 0.1, 0);
    s.bezierCurveTo(0.1, -0.05, 0, -0.1, 0, -0.15);
    s.bezierCurveTo(0, -0.1, -0.1, -0.05, -0.1, 0);
    s.bezierCurveTo(-0.1, 0.1, 0, 0.05, 0, 0);
    return s;
  }, []);

  return (
    <mesh position={[0.12, 1.0, 0.19]} rotation={[0, 0, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={DARKER_PINK_THEME} emissive={DARKER_PINK_THEME} emissiveIntensity={0.5} />
    </mesh>
  );
};

const BlockHumanoid = forwardRef(({ scale = 1, materialProps, poseProps = {}, isHelper = false }, ref) => {
  const { 
    leftLegRotation = [0, 0, 0], 
    rightLegRotation = [0, 0, 0], 
    leftArmRotation = [0.2, 0, -0.1], 
    rightArmRotation = [0.2, 0, 0.1], 
    position = [0,0,0], 
    rotation = [0,0,0], 
    cane = false,
    walker = false,
    isLeaning = false,
    isWalking = false,
    walkSpeed = 8,
    torsoRotationX = 0,
    headRotationY = 0,
    animateArmsTo = null 
  } = poseProps;
  
  const torsoRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const headRef = useRef();
  const innerGroupRef = useRef();

  useImperativeHandle(ref, () => ({
    leftLeg: leftLegRef.current,
    rightLeg: rightLegRef.current,
    leftArm: leftArmRef.current,
    rightArm: rightArmRef.current,
    head: headRef.current,
    torso: torsoRef.current,
    group: innerGroupRef.current
  }));

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
    if (torsoRef.current) torsoRef.current.rotation.x = torsoRotationX;
    if (headRef.current) headRef.current.rotation.y = headRotationY;
    
    if (isWalking) {
      const swing = Math.sin(t * walkSpeed) * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.5;
    } else if (animateArmsTo) {
      const reachProgress = THREE.MathUtils.smoothstep(t, 0.5, 3.5); 
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRotation[0], animateArmsTo[0], reachProgress);
      }
    } else {
        if (leftArmRef.current) leftArmRef.current.rotation.set(...leftArmRotation);
        if (rightArmRef.current) rightArmRef.current.rotation.set(...rightArmRotation);
    }
    
    if (!isWalking && leftLegRef.current) leftLegRef.current.rotation.set(...leftLegRotation);
    if (!isWalking && rightLegRef.current) rightLegRef.current.rotation.set(...rightLegRotation);
  });

  return (
    <group scale={scale} position={position} rotation={rotation} ref={innerGroupRef}>
      <group ref={torsoRef}>
        <mesh ref={headRef} position={[0, 1.4, 0]} castShadow><sphereGeometry args={[0.22, 32, 32]} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0, 0.3, 0]} castShadow><primitive object={torsoGeo} /><meshStandardMaterial {...materialProps} /></mesh>
        {isHelper && <HeartBadge />}
        <group position={[0, 1.2, 0]}>
          <group ref={leftArmRef} position={[-0.22, 0, 0]}><mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
          <group ref={rightArmRef} position={[0.22, 0, 0]}>
            <mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} />
              {cane && <mesh position={[0, -0.7, 0.1]}><cylinderGeometry args={[0.015, 0.015, 1.1]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>}
            </mesh>
          </group>
        </group>
      </group>
      {walker && (
        <group position={[0, -0.2, 0.35]}>
          <mesh position={[0.3, 0.45, 0]}><boxGeometry args={[0.03, 0.9, 0.03]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
          <mesh position={[-0.3, 0.45, 0]}><boxGeometry args={[0.03, 0.9, 0.03]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
          <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.65, 0.03, 0.03]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
          <mesh position={[0.3, 0.45, 0.3]}><boxGeometry args={[0.03, 0.9, 0.03]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
          <mesh position={[-0.3, 0.45, 0.3]}><boxGeometry args={[0.03, 0.9, 0.03]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
          <mesh position={[0, 0.85, 0.3]}><boxGeometry args={[0.6, 0.03, 0.03]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
        </group>
      )}
      <group position={[0, 0.4, 0]}>
        <group ref={leftLegRef} position={[-0.12, 0, 0]}><mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
        <group ref={rightLegRef} position={[0.12, 0, 0]}><mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
      </group>
    </group>
  );
});

// --- GRASS ---
const GrassySassyHills = () => {
  const meshRef = useRef();
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.05, 1.2, 1, 4);
    g.translate(0, 0.6, 0);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) { pos[i] += Math.pow(pos[i + 1] / 1.2, 2) * 0.15; }
    g.computeVertexNormals(); return g;
  }, []);
  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) { pos[i + 1] = getHillHeight(pos[i], pos[i + 2]); }
    g.computeVertexNormals(); return g;
  }, []);
  const grassMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColorRoots: { value: new THREE.Color("#13051a") }, uColorTips: { value: new THREE.Color("#c292f5") } },
    vertexShader: `varying float vHeight; uniform float uTime; void main() { vHeight = position.y / 1.2; vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float totalWind = (sin(uTime * 0.5 + worldPos.x * 0.05) + sin(uTime * 2.0 + worldPos.x * 0.2)) * vHeight; vec3 pos = position; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0); }`,
    fragmentShader: `varying float vHeight; uniform vec3 uColorRoots; uniform vec3 uColorTips; void main() { gl_FragColor = vec4(mix(uColorRoots, uColorTips, vHeight) * pow(vHeight, 0.4), 1.0); }`,
    side: THREE.DoubleSide
  }), []);
  useFrame((state) => {
    grassMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 400; const z = (Math.random() - 0.5) * 400; const y = getHillHeight(x, z);
        if (y > 0.05) { dummy.position.set(x, y - 0.05, z); dummy.rotation.y = Math.random() * Math.PI; dummy.scale.setScalar(0.6 + Math.random() * 0.8); dummy.updateMatrix(); meshRef.current.setMatrixAt(i, dummy.matrix); }
        else { dummy.scale.setScalar(0); dummy.updateMatrix(); meshRef.current.setMatrixAt(i, dummy.matrix); }
      }
      meshRef.current.instanceMatrix.needsUpdate = true; meshRef.current._init = true;
    }
  });
  return <group position={[0, -3.5, -40]}><mesh geometry={terrainGeo} receiveShadow><meshStandardMaterial color="#0c020f" roughness={1} /></mesh><instancedMesh ref={meshRef} args={[bladeGeo, grassMaterial, GRASS_COUNT]} castShadow /></group>;
};

// --- ARCHITECTURE ---
const Staircase = ({ position, width, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    {Array.from({ length: 16 }).map((_, i) => (
      <group key={i} position={[0, -i * 0.5, i * 0.8]}>
        <mesh castShadow receiveShadow><boxGeometry args={[width, 0.5, 0.8]} /><meshStandardMaterial {...materialProps} /></mesh>
        <mesh position={[0, -2.5, 0]} castShadow receiveShadow><boxGeometry args={[width, 5, 0.8]} /><meshStandardMaterial {...materialProps} /></mesh>
      </group>
    ))}
  </group>
);

const Bench = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow><boxGeometry args={[3, 0.1, 1.2]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
    <mesh position={[0, 1, -0.55]} rotation={[-0.1, 0, 0]} castShadow receiveShadow><boxGeometry args={[3, 1, 0.1]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
    {[[-1.3, 0, 0.45], [1.3, 0, 0.45], [-1.3, 0, -0.45], [1.3, 0, -0.45]].map((pos, i) => (
      <mesh key={i} position={[pos[0], 0.225, pos[2]]} castShadow receiveShadow><boxGeometry args={[0.1, 0.45, 0.1]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
    ))}
  </group>
);

const WallOpening = ({ position, colorProps, width = 6, openingW = 4.8, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    <mesh position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]} castShadow receiveShadow><boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    {isWindow && <mesh position={[0, 2, 0]} castShadow receiveShadow><boxGeometry args={[openingW, 4, 2]} /><meshStandardMaterial {...colorProps} /></mesh>}
  </group>
);

// --- ANIMATED CHAPTERS ---
const WheelchairChapter = ({ butterProps, isMobile }) => {
  const groupRef = useRef(); 
  const wheelRef = useRef(); 
  const [isMoving, setIsMoving] = useState(true);
  
  const startZ = isMobile ? 13 : 22; 
  const finalStopZ = 12.5; 

  useFrame((state) => {
    const t = Math.min(state.clock.elapsedTime / 14, 1);
    const smoothProgress = THREE.MathUtils.smoothstep(t, 0, 1);
    const currentZ = startZ + (finalStopZ - startZ) * smoothProgress;
    
    if (groupRef.current) groupRef.current.position.z = currentZ;

    if (t >= 1) {
      if (isMoving) setIsMoving(false);
    } else {
      if (wheelRef.current) wheelRef.current.rotation.x = state.clock.elapsedTime * 2.5;
    }
  });

  return (
    <group ref={groupRef} position={[14.5, 1.9, startZ]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.6, 0.08, 0.6]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
        <mesh position={[0, 0.9, -0.25]} rotation={[0.1, 0, 0]} castShadow><boxGeometry args={[0.55, 0.7, 0.08]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
        <group position={[0, 0.45, -0.05]} ref={wheelRef}>
          <mesh position={[-0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.04, 16, 50]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
          <mesh position={[0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.04, 16, 50]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
        </group>
      <group position={[0, 0.2, 0]}><BlockHumanoid scale={0.85} materialProps={butterProps} poseProps={{ rotation: [0, Math.PI, 0], leftLegRotation: [Math.PI / 2, 0, 0], rightLegRotation: [Math.PI / 2, 0, 0], leftArmRotation: [0.7, 0, 0], rightArmRotation: [0.7, 0, 0]}} /></group>
      <group position={[0, 0, -0.75]}><BlockHumanoid isHelper scale={0.95} materialProps={butterProps} poseProps={{ isWalking: isMoving, walkSpeed: 10, leftArmRotation: [-1.2, 0, 0.1], rightArmRotation: [-1.2, 0, -0.1] }} /></group>
    </group>
  );
};

const WalkingToConversationChapter = ({ butterProps }) => {
  const groupRef = useRef(); 
  const p1Ref = useRef(); 
  const p2Ref = useRef(); 
  const [phase, setPhase] = useState("walking");
  const finalStopZ = 22.0;

  useFrame((state) => {
    const et = state.clock.elapsedTime;
    const t = Math.min(et / 16, 1);
    const smoothProgress = THREE.MathUtils.smoothstep(t, 0, 1);
    
    if (phase === "walking") {
      groupRef.current.position.z = 4.0 + (finalStopZ - 4.0) * smoothProgress;

      if (p1Ref.current) {
        const swingA = Math.sin(et * 10.5) * 0.45;
        p1Ref.current.leftLeg.rotation.x = swingA;
        p1Ref.current.rightLeg.rotation.x = -swingA;
        p1Ref.current.leftArm.rotation.x = -swingA * 0.6;
        p1Ref.current.group.position.y = Math.abs(swingA) * 0.06;
      }

      if (p2Ref.current) {
        const swingB = Math.sin((et - 0.5) * 9.2) * 0.35;
        p2Ref.current.leftLeg.rotation.x = swingB;
        p2Ref.current.rightLeg.rotation.x = -swingB;
        p2Ref.current.leftArm.rotation.x = -swingB * 0.6;
        p2Ref.current.rightArm.rotation.x = swingB * 0.6;
        p2Ref.current.group.position.y = Math.abs(swingB) * 0.04;
      }

      if (t >= 1) {
          setPhase("talking");
          [p1Ref, p2Ref].forEach(p => {
              if (p.current) {
                p.current.leftLeg.rotation.x = 0;
                p.current.rightLeg.rotation.x = 0;
                p.current.leftArm.rotation.x = 0.2;
                p.current.rightArm.rotation.x = 0.2;
                p.current.group.position.y = 0;
              }
          });
      }
    } else {
      if (p1Ref.current) {
        p1Ref.current.head.rotation.x = Math.sin(et * 1.5) * 0.1;
        p1Ref.current.head.rotation.z = Math.cos(et * 0.8) * 0.05;
      }
      if (p2Ref.current) {
        p2Ref.current.head.rotation.x = Math.sin(et * 2.2 + 0.5) * 0.12;
        p2Ref.current.head.rotation.y = -0.4 + Math.sin(et * 1.2) * 0.1;
      }
    }
  });

  const turnFactor = phase === "talking" ? 1 : 0;
  
  return (
    <group ref={groupRef} position={[7.5, 1.9, 4.0]} rotation={[0, Math.PI, 0]}>
        <BlockHumanoid 
          ref={p1Ref}
          scale={0.95} 
          materialProps={butterProps} 
          poseProps={{ 
            isWalking: false, 
            cane: true, 
            rotation: [0, -0.6 * turnFactor, 0], 
            position: [-0.4, 0, 0], 
            headRotationY: 1.2 * turnFactor,
          }} 
        />
        <group position={[0.4, 0, 0]}>
          <BlockHumanoid 
            ref={p2Ref}
            isHelper 
            scale={0.95} 
            materialProps={butterProps} 
            poseProps={{ 
              isWalking: false, 
              rotation: [0, 0.6 * turnFactor, 0], 
              headRotationY: phase === "walking" ? 0 : -0.4 
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
  const extraWallHeight = isMobile ? 30 : 0; 
  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  useEffect(() => { if (waterNormals) waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; }, [waterNormals]);

  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-18, 4.5, 38) : new THREE.Vector3(-13, 3.2, 28)) : new THREE.Vector3(-24.5, 3.5, -450);
    const targetLook = isHome ? new THREE.Vector3(20, 1.2, -2) : new THREE.Vector3(-24.5, 1.5, -1000);
    
    camera.position.lerp(targetPos, 0.05); 
    camera.lookAt(targetLook);
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.08;
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <GrassySassyHills />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow />

      <group position={[0, 0, 0]}>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow><boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} /></mesh>
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />

        <group position={[-16, -1.6, 0]}>
          <mesh position={[1, 8.5 + extraWallHeight/2, 0]} castShadow receiveShadow><boxGeometry args={[4, 17 + extraWallHeight, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={butterProps} /> 
          <WallOpening position={[12, 0, 0]} colorProps={butterProps} /> 
          <mesh position={[24, 8.5 + extraWallHeight/2, 0]} castShadow receiveShadow><boxGeometry args={[18, 17 + extraWallHeight, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        <group position={[17, -1.6, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[0.5, 8.5 + extraWallHeight/2, 0]}><boxGeometry args={[1, 17 + extraWallHeight, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <mesh castShadow receiveShadow position={[4.5, 8.5 + extraWallHeight/2, 0]}><boxGeometry args={[7, 17 + extraWallHeight, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={butterProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={butterProps} />
          <mesh castShadow receiveShadow position={[24, 8.5 + extraWallHeight/2, 0]}><boxGeometry args={[8, 17 + extraWallHeight, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        <group>
          <group position={[14, 1.9, 4]} rotation={[0, -Math.PI / 2, 0]}>
            <Bench materialProps={butterProps} />
          </group>

          <WalkingToConversationChapter butterProps={butterProps} />

          <group position={[14, 1.9, 4]} rotation={[0, -Math.PI / 2, 0]}>
            <group position={[3.5, 0, -0.2]} rotation={[0, -0.5, 0]}>
               <BlockHumanoid 
                scale={0.84} 
                materialProps={butterProps} 
                poseProps={{ 
                  walker: true, 
                  torsoRotationX: 0.1, 
                  leftArmRotation: [0.1, 0, -0.1], 
                  rightArmRotation: [0.1, 0, 0.1], 
                  animateArmsTo: [-1.1, 0, -0.1], 
                  leftLegRotation: [0.15, 0, 0],   
                  rightLegRotation: [-0.1, 0, 0],  
                  headRotationY: -0.2
                }} 
               />
               <BlockHumanoid 
                isHelper
                scale={0.95} 
                materialProps={butterProps} 
                poseProps={{ 
                  position: [-0.95, 0, 0.35], 
                  rotation: [0, 0.65, 0], 
                  headRotationY: -0.4,
                  leftArmRotation: [-0.8, 0, -0.25] 
                }} 
               />
            </group>
          </group>

          <group position={[6.0, 1.6, 10.0]} rotation={[0, Math.PI / 2, 0]}>
            <BlockHumanoid isHelper scale={0.9} materialProps={butterProps} poseProps={{ position: [-0.2, 0, 0], rotation: [0, -0.4, 0]}} />
            <BlockHumanoid scale={0.88} materialProps={butterProps} poseProps={{ leftLegRotation: [Math.PI / 2, 0, 0], rightLegRotation: [Math.PI / 2, 0, 0], position: [0.5, 0, 0]}} />
          </group>

          <WheelchairChapter butterProps={butterProps} isMobile={isMobile} />
        </group>
      </group>

      <water 
        ref={waterRef} 
        args={[
          new THREE.PlaneGeometry(2000, 2000), 
          { 
            waterNormals, 
            sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), 
            sunColor: 0xffffff, 
            waterColor: TITLE_PURPLE, 
            distortionScale: 1.0, 
            alpha: 0.95 
          }
        ]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.45, 0]} 
      />

      {/* Circle Platform with fixing Helper and Lamp over Bob */}
      <FloatingPlatform butterProps={butterProps} />
    </>
  );
}