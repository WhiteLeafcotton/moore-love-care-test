import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 400000;
const TITLE_PURPLE = "#21162e"; 
const DARKER_PINK_THEME = "#bf9fb3"; 

// --- HELPER FOR TERRAIN HEIGHT ---
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

// --- THE FIXED FLOATING PLATFORM COMPONENT (NESTED UNIT) ---
const FloatingPlatform = () => {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* This group anchors the entire set to the correct world spot [14, -1.1, 12].
          Nesting the chair and lamp here means they "belong" to the platform.
      */}
      <group position={[14, -1.1, 12]}> 
        
        {/* 1. The Glassy Platform Base */}
        <mesh receiveShadow castShadow renderOrder={10000}>
          <cylinderGeometry args={[3, 3, 0.2, 64]} /> 
          <meshBasicMaterial 
            color="#ffffff" 
            transparent={true} 
            opacity={0.85} 
            depthTest={false} 
          />
        </mesh>

        {/* 2. The Chair - Centered ON the circle [0, 0.15, 0] */}
        <group position={[0, 0.15, 0]} rotation={[0, Math.PI / 4, 0]} scale={0.8}>
          <mesh castShadow>
            <boxGeometry args={[1, 0.5, 0.9]} />
            <meshStandardMaterial color="#fce4e4" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, -0.4]} rotation={[-0.1, 0, 0]} castShadow>
            <boxGeometry args={[1, 1, 0.2]} />
            <meshStandardMaterial color="#fce4e4" roughness={0.8} />
          </mesh>
        </group>

        {/* 3. The Lamp - Positioned slightly aside the chair */}
        <group position={[0.8, 0.15, -0.2]} scale={0.8}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1, 16]} />
            <meshStandardMaterial color="#222" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <coneGeometry args={[0.2, 0.3, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>

      </group>
    </Float>
  );
};

// --- HUMANOID & BADGE ---
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
    torsoRotationZ = 0,
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
    if (torsoRef.current) {
        torsoRef.current.rotation.z = torsoRotationZ;
        torsoRef.current.rotation.x = torsoRotationX;
        if (isLeaning) torsoRef.current.rotation.z += Math.sin(t * 0.5) * 0.15;
    }
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
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRotation[2], animateArmsTo[2], reachProgress);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRotation[0], animateArmsTo[0], reachProgress);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRotation[2], -animateArmsTo[2], reachProgress);
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

// --- TERRAIN & ARCHITECTURE ---
const GrassySassyHills = () => {
  const meshRef = useRef();
  const bladeGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.05, 1.2, 1, 4);
    g.translate(0, 0.6, 0);
    return g;
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

const Bench = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow><boxGeometry args={[3, 0.1, 1.2]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
    <mesh position={[0, 1, -0.55]} rotation={[-0.1, 0, 0]} castShadow receiveShadow><boxGeometry args={[3, 1, 0.1]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
    {[[-1.3, 0, 0.45], [1.3, 0, 0.45], [-1.3, 0, -0.45], [1.3, 0, -0.45]].map((pos, i) => (
      <mesh key={i} position={[pos[0], 0.225, pos[2]]} castShadow receiveShadow><boxGeometry args={[0.1, 0.45, 0.1]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
    ))}
  </group>
);

// --- MAIN SCENE ---
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;

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

  const butterProps = { color: "#fce4e4", roughness: 0.9, metalness: 0.02 };

  return (
    <>
      <Sky distance={450000} sunPosition={[-20, 8, -100]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      <GrassySassyHills />
      <directionalLight position={[-15, 30, 10]} intensity={1.6} castShadow />

      {/* Main Architecture */}
      <group>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow><boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} /></mesh>
        
        <group position={[14, 1.9, 4]} rotation={[0, -Math.PI / 2, 0]}>
          <Bench materialProps={butterProps} />
        </group>

        {/* Example Humanoid Placement */}
        <group position={[14.5, 1.9, 12.5]} rotation={[0, Math.PI, 0]}>
          <BlockHumanoid scale={0.85} materialProps={butterProps} poseProps={{ rotation: [0, Math.PI, 0] }} />
        </group>
      </group>

      <water 
        ref={waterRef} 
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), sunColor: 0xffffff, waterColor: TITLE_PURPLE, distortionScale: 1.0, alpha: 0.95 }]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.45, 0]} 
      />

      {/* THE SOLAIRUM UNIT: Circle + Chair + Lamp */}
      <FloatingPlatform />
    </>
  );
}