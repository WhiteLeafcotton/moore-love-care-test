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

// --- NEW COMPONENT: L-SHAPE HOME LAMP ---
const HomeLamp = ({ position }) => (
  <group position={position}>
    {/* Base */}
    <mesh position={[0, 0.05, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
      <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Vertical Pole */}
    <mesh position={[0, 1.5, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 3, 16]} />
      <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* L-Bend (Horizontal Arm) */}
    <mesh position={[0.4, 3.0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
      <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Shade */}
    <mesh position={[0.8, 2.8, 0]}>
      <cylinderGeometry args={[0.3, 0.5, 0.6, 32, 1, true]} />
      <meshStandardMaterial color="#fff" transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
    {/* Bulb/Light Source */}
    <mesh position={[0.8, 2.75, 0]}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
    </mesh>
    <pointLight position={[0.8, 2.7, 0]} intensity={1.5} distance={10} color="#fff" />
  </group>
);

const LazyBoyChair = ({ position, rotation }) => (
  <group position={position} rotation={rotation} scale={0.7}>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.5, 0.8, 1.5]} />
      <meshStandardMaterial color={DARKER_PINK_THEME} roughness={0.8} />
    </mesh>
    <mesh position={[0, 1.2, -0.6]} rotation={[-0.3, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.5, 1.6, 0.4]} />
      <meshStandardMaterial color={DARKER_PINK_THEME} roughness={0.8} />
    </mesh>
    {[-0.85, 0.85].map((x, i) => (
      <mesh key={i} position={[x, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.6, 1.5]} />
        <meshStandardMaterial color={DARKER_PINK_THEME} roughness={0.8} />
      </mesh>
    ))}
  </group>
);

const FloatingPlatform = ({ butterProps }) => {
  return (
    <Float speed={1.8} rotationIntensity={0.1} floatIntensity={0.4} position={[11, -1.0, 17]}>
      {/* Platform Disk */}
      <mesh receiveShadow>
        <cylinderGeometry args={[4.2, 4.2, 0.25, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.8} roughness={0.1} />
      </mesh>

      {/* Circle Rug */}
      <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.5, 64]} />
        <meshStandardMaterial color={TITLE_PURPLE} transparent opacity={0.2} />
      </mesh>

      {/* Recliner - Rotated 180 degrees */}
      <LazyBoyChair position={[0, 0.15, -0.5]} rotation={[0, Math.PI, 0]} />

      {/* Bob */}
      <group position={[0, 0.62, -0.5]} rotation={[0, Math.PI, 0]}>
        <BlockHumanoid 
          scale={0.8} 
          materialProps={butterProps} 
          poseProps={{ 
            leftLegRotation: [1.5, 0, 0], 
            rightLegRotation: [1.5, 0, 0], 
            torsoRotationX: 0.05 
          }} 
        />
      </group>

      {/* The Lamp */}
      <HomeLamp position={[-1.2, 0.14, -0.5]} />

      {/* Helper */}
      <group position={[1.5, 0.14, 1.2]} rotation={[0, -Math.PI / 4, 0]}>
        <BlockHumanoid 
          isHelper 
          scale={0.92} 
          materialProps={butterProps} 
          poseProps={{ 
            headRotationY: -0.4, 
            rightArmRotation: [1.1, 0, -0.3] 
          }} 
        />
      </group>
    </Float>
  );
};

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
    } else {
        if (leftArmRef.current) leftArmRef.current.rotation.set(...leftArmRotation);
        if (rightArmRef.current) rightArmRef.current.rotation.set(...rightArmRotation);
        if (leftLegRef.current) leftLegRef.current.rotation.set(...leftLegRotation);
        if (rightLegRef.current) rightLegRef.current.rotation.set(...rightLegRotation);
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
      <group position={[0, 0.4, 0]}>
        <group ref={leftLegRef} position={[-0.12, 0, 0]}><mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
        <group ref={rightLegRef} position={[0.12, 0, 0]}><mesh castShadow><primitive object={limbGeo} /><meshStandardMaterial {...materialProps} /></mesh></group>
      </group>
    </group>
  );
});

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
    vertexShader: `varying float vHeight; uniform float uTime; void main() { vHeight = position.y / 1.2; vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vHeight; uniform vec3 uColorRoots; uniform vec3 uColorTips; void main() { gl_FragColor = vec4(mix(uColorRoots, uColorTips, vHeight), 1.0); }`,
    side: THREE.DoubleSide
  }), []);
  useFrame((state) => {
    grassMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    if (meshRef.current && !meshRef.current._init) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const x = (Math.random() - 0.5) * 400; const z = (Math.random() - 0.5) * 400; const y = getHillHeight(x, z);
        if (y > 0.05) { dummy.position.set(x, y - 0.05, z); dummy.updateMatrix(); meshRef.current.setMatrixAt(i, dummy.matrix); }
      }
      meshRef.current.instanceMatrix.needsUpdate = true; meshRef.current._init = true;
    }
  });
  return <group position={[0, -3.5, -40]}><mesh geometry={terrainGeo} receiveShadow><meshStandardMaterial color="#0c020f" /></mesh><instancedMesh ref={meshRef} args={[bladeGeo, grassMaterial, GRASS_COUNT]} castShadow /></group>;
};

const Staircase = ({ position, width, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    {Array.from({ length: 16 }).map((_, i) => (
      <group key={i} position={[0, -i * 0.5, i * 0.8]}>
        <mesh castShadow receiveShadow><boxGeometry args={[width, 0.5, 0.8]} /><meshStandardMaterial {...materialProps} /></mesh>
      </group>
    ))}
  </group>
);

const Bench = ({ position, rotation, materialProps }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow><boxGeometry args={[3, 0.1, 1.2]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
    <mesh position={[0, 1, -0.55]} rotation={[-0.1, 0, 0]} castShadow receiveShadow><boxGeometry args={[3, 1, 0.1]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
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

const WheelchairChapter = ({ butterProps, isMobile }) => {
  const groupRef = useRef(); 
  const [isMoving, setIsMoving] = useState(true);
  const startZ = isMobile ? 13 : 22; 
  const finalStopZ = 12.5; 

  useFrame((state) => {
    const t = Math.min(state.clock.elapsedTime / 14, 1);
    const smoothProgress = THREE.MathUtils.smoothstep(t, 0, 1);
    if (groupRef.current) groupRef.current.position.z = startZ + (finalStopZ - startZ) * smoothProgress;
    if (t >= 1 && isMoving) setIsMoving(false);
  });

  return (
    <group ref={groupRef} position={[14.5, 1.9, startZ]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.6, 0.08, 0.6]} /><meshStandardMaterial color={DARKER_PINK_THEME} /></mesh>
        <group position={[0, 0.2, 0]}><BlockHumanoid scale={0.85} materialProps={butterProps} poseProps={{ rotation: [0, Math.PI, 0], leftLegRotation: [Math.PI / 2, 0, 0], rightLegRotation: [Math.PI / 2, 0, 0]}} /></group>
        <group position={[0, 0, -0.75]}><BlockHumanoid isHelper scale={0.95} materialProps={butterProps} poseProps={{ isWalking: isMoving }} /></group>
    </group>
  );
};

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const isMobile = size.width < 768;
  const butterProps = { color: "#fce4e4", roughness: 0.8, metalness: 0.1 };

  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

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
          <mesh position={[1, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={butterProps} /> 
          <mesh position={[24, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...butterProps} /></mesh>
        </group>

        <WheelchairChapter butterProps={butterProps} isMobile={isMobile} />
      </group>

      <water 
        ref={waterRef} 
        args={[new THREE.PlaneGeometry(2000, 2000), { waterNormals, sunDirection: new THREE.Vector3(-10, 10, -100).normalize(), sunColor: 0xffffff, waterColor: TITLE_PURPLE, distortionScale: 1.0, alpha: 0.95 }]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.45, 0]} 
      />

      <FloatingPlatform butterProps={butterProps} />
    </>
  );
}