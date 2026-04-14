import { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, Float } from "@react-three/drei"; 
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GRASS_COUNT = 80000; 
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

// --- THE CIRCULAR FLOATING PLATFORM (FIXED POSITION) ---
const FloatingPlatform = ({ butterProps }) => {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* Moved position here to ensure the whole group (chair/lamp/people) floats together */}
      <group position={[12, -0.6, 18]}> 
        {/* THE DISC */}
        <mesh renderOrder={1}>
          <cylinderGeometry args={[3.5, 3.5, 0.2, 64]} /> 
          <meshStandardMaterial 
            color="#ffffff" 
            transparent={true} 
            opacity={0.9} 
            roughness={0.1}
          />
        </mesh>

        {/* RUG */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
            <circleGeometry args={[2.8, 64]} />
            <meshStandardMaterial color="#2a1d38" />
        </mesh>

        {/* CHAIR */}
        <group position={[-0.8, 0.1, 0]} rotation={[0, 0.5, 0]}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[1.4, 0.2, 1.4]} />
                <meshStandardMaterial color="#3b2a4d" />
            </mesh>
            <mesh position={[0, 1.1, -0.65]} rotation={[-0.1, 0, 0]} castShadow>
                <boxGeometry args={[1.4, 1.4, 0.2]} />
                <meshStandardMaterial color="#3b2a4d" />
            </mesh>
        </group>

        {/* LAMP */}
        <group position={[1.6, 0.1, -1.0]}>
            <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.05, 0.05, 3]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh position={[-0.7, 3, 0]}><boxGeometry args={[1.4, 0.05, 0.05]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh position={[-1.4, 2.6, 0]}>
                <sphereGeometry args={[0.15, 32, 32]} />
                <meshStandardMaterial emissive="#ffdca8" emissiveIntensity={6} color="#fff4cc" />
            </mesh>
            <pointLight position={[-1.4, 2.6, 0]} intensity={2.5} distance={10} color="#ffdca8" />
        </group>

        {/* CHARACTERS ON PLATFORM */}
        <group position={[-0.8, 0.45, 0]}>
             <BlockHumanoid scale={0.8} materialProps={butterProps} poseProps={{ leftLegRotation: [Math.PI/2, 0, 0], rightLegRotation: [Math.PI/2, 0, 0], headRotationY: 0.4 }} />
        </group>
        <group position={[1.2, 0.1, 1.0]} rotation={[0, -0.6, 0]}>
             <BlockHumanoid isHelper scale={0.9} materialProps={butterProps} poseProps={{ isLeaning: true, headRotationY: -0.3 }} />
        </group>
      </group>
    </Float>
  );
};

// --- HUMANOID COMPONENTS ---
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
    }
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

const WallOpening = ({ position, colorProps, width = 6, openingW = 4.8, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[(width - openingW) / 2, height, 2]} /><meshStandardMaterial {...colorProps} /></mesh>
    <mesh position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]} castShadow receiveShadow><boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} /><meshStandardMaterial {...colorProps} /></mesh>
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
    const targetPos = isHome ? (isMobile ? new THREE.Vector3(-18, 5, 42) : new THREE.Vector3(-14, 4.5, 34)) : new THREE.Vector3(-24.5, 3.5, -450);
    const targetLook = isHome ? new THREE.Vector3(8, 1.5, 10) : new THREE.Vector3(-24.5, 1.5, -1000);
    
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

      <group position={[0, 0, 0]}>
        <mesh position={[15.5, -2.1, 15.0]} castShadow receiveShadow><boxGeometry args={[20, 8.0, 30]} /><meshStandardMaterial {...butterProps} /></mesh>
        <Staircase position={[5.0, 1.5, 8.5]} rotation={[0, -Math.PI / 2, 0]} width={17.5} materialProps={butterProps} />

        <group position={[-16, -1.6, 0]}>
          <mesh position={[1, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={butterProps} /> 
          <mesh position={[24, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
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

      <FloatingPlatform butterProps={butterProps} />
    </>
  );
}