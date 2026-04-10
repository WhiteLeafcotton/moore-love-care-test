// consolidated, correct imports (REMOVE ALL OTHERS)
import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud, OrbitControls } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* -----------------------------------------------------------
   UPGRADED DETAILED GRASS MATERIAL (The fix)
   Injects swaying logic directly into a Standard material for GPU performance.
----------------------------------------------------------- */
function useDetailedGrassMaterial() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  // CRITICAL: You must provide a diffuse texture and an alpha mask!
  const grassMap = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass_blade_tex.png`);
  const grassAlpha = useLoader(THREE.TextureLoader, `${baseUrl}textures/grass_blade_alpha.png`);

  return useMemo(() => {
    // Configure textures
    grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping;
    grassAlpha.wrapS = grassAlpha.wrapT = THREE.RepeatWrapping;

    const mat = new THREE.MeshStandardMaterial({
      color: "#2f4f2f", // Slightly darker base color
      map: grassMap,
      alphaMap: grassAlpha,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      transparent: false,
    });

    // Vertex shader injection for waving
    mat.onBeforeCompile = (shader) => {
      // Define a time uniform and pass height to fragment shader
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `
        uniform float uTime;
        varying float vHeight; 
      ` + shader.vertexShader;

      // Replace position calculation with a wave function
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        vec3 transformed = vec3(position);
        vHeight = position.y; // Track blade height

        // Basic sway: Sin wave based on time and a spatial offset
        // Adjust these numbers to change wind intensity
        float wave = sin(uTime * 2.0 + instanceMatrix[3][0] * 0.4) * 0.2;
        wave += sin(uTime * 1.3 + instanceMatrix[3][1] * 0.3) * 0.1;
        
        // Apply sway based on height^2 (keeps roots still, moves tips most)
        float bend = pow(position.y, 2.0) * wave;
        
        transformed.x += bend;
        transformed.z += bend * 0.5;
        `
      );

      // Pass the updated shader reference for time updates
      mat.userData.shader = shader;
    };
    
    return mat;
  }, [grassMap, grassAlpha]);
}

/* -----------------------------------------------------------
   ORIGINAL STAIRCASE (Restored)
----------------------------------------------------------- */
const Staircase = ({ position, width, texture, rotation }) => {
  const stepHeight = 0.5;
  const stepDepth = 0.8;
  const numSteps = 16;

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: numSteps }).map((_, i) => (
        <group key={i} position={[0, -i * stepHeight, i * stepDepth]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, stepHeight, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} metalness={0.05} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} metalness={0.05} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* -----------------------------------------------------------
   ORIGINAL WALL OPENING (Restored)
----------------------------------------------------------- */
const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh castShadow receiveShadow position={[0, height - (height - openingH - (isWindow ? 4 : 0)) / 2, 0]}>
      <boxGeometry args={[openingW, height - openingH - (isWindow ? 4 : 0), 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    {isWindow && (
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[openingW, 4, 2]} />
        <meshStandardMaterial {...colorProps} />
      </mesh>
    )}
  </group>
);

/* -----------------------------------------------------------
   SCENE COMPONENT (Main Scene with New Grass Mesh)
----------------------------------------------------------- */
export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const sunPlasmaRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  // New detailed grass components
  const grassMaterial = useDetailedGrassMaterial();
  const grassInstanceRef = useRef();
  const grassCount = isMobile ? 15000 : 35000; // Dense game grass count

  // Original Texture Loads
  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");
  const sunPlasmaTex = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

  // Generate detailed grass geometry once
  const detailedGrassGeometry = useMemo(() => {
    // A cross mesh (two planes interlocked) gives grass better volume
    const baseGeom = new THREE.PlaneGeometry(0.3, 1.5, 1, 6); // More height segments for smooth bending
    baseGeom.translate(0, 0.75, 0); // Pivot at the base
    return baseGeom;
  }, []);

  // ORIGINAL Camera Initialization (Restored)
  useEffect(() => {
    const startPos = isMobile ? new THREE.Vector3(-30, 8, 60) : new THREE.Vector3(-15, 1.5, 30);
    camera.position.copy(startPos);
    camera.lookAt(lookAtTarget.current);
  }, [camera, isMobile]);

  // Scene Animations and Grass Population
  useEffect(() => {
    // Original Texture configs (Restored)
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(2, 2);
    }
    if (sunPlasmaTex) {
      sunPlasmaTex.wrapS = sunPlasmaTex.wrapT = THREE.RepeatWrapping;
      sunPlasmaTex.repeat.set(1.5, 1.5);
      sunPlasmaRef.current = sunPlasmaTex;
    }

    // Populate the grass instances (Restored placement logic on ground mesh)
    const dummy = new THREE.Object3D();
    for (let i = 0; i < grassCount; i++) {
      const x = (Math.random() - 0.5) * 40; // Restrict to the ground plane area
      const z = (Math.random() - 0.5) * 30; // Restrict to the ground plane area
      const y = -1.95; // Just slightly above the water plane

      dummy.position.set(x, y, z);
      // Random Y rotation for variety, slight pitch randomization
      dummy.rotation.set(Math.PI / 2 + (Math.random()-0.5)*0.1, 0, Math.random() * Math.PI);
      // Randomize height and width slightly
      dummy.scale.set(0.5 + Math.random(), 0.8 + Math.random()*0.5, 0.5+Math.random());
      dummy.updateMatrix();
      grassInstanceRef.current.setMatrixAt(i, dummy.matrix);
    }
    grassInstanceRef.current.instanceMatrix.needsUpdate = true;

  }, [pinkStoneTex, sunPlasmaTex, grassCount]);

  // Original Frame Updates (Restored)
  useFrame((state, delta) => {
    const isHome = currentView === "home";
    const LERP_SPEED = 0.04;
    const sweetSpotPos = isMobile ? new THREE.Vector3(-30, 8, 65) : new THREE.Vector3(-15, 1.5, 30);
    const sweetSpotLook = new THREE.Vector3(12, 1.5, 0);
    const exitFinalPos = new THREE.Vector3(-8, 1.5, -100);
    const exitLook = new THREE.Vector3(-8, 1.5, -200);

    if (isHome) {
      camera.position.lerp(sweetSpotPos, LERP_SPEED);
      lookAtTarget.current.lerp(sweetSpotLook, LERP_SPEED);
    } else {
      camera.position.lerp(exitFinalPos, LERP_SPEED);
      lookAtTarget.current.lerp(exitLook, LERP_SPEED);
    }
    camera.lookAt(lookAtTarget.current);

    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.2;
    if (sunPlasmaRef.current) {
      sunPlasmaRef.current.offset.x += delta * 0.03;
      sunPlasmaRef.current.offset.y -= delta * 0.05;
    }

    // NEW Grass Sway Update (Critical)
    if (grassMaterial.userData.shader) {
      grassMaterial.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 1.8;
      if (cloudGroupRef.current.position.x > 180) cloudGroupRef.current.position.x = -180;
    }
  });

  return (
    <>
      {/* Restored Original Sky/Fog */}
      <Sky distance={450000} sunPosition={[-10, 6, -100]} inclination={0.49} azimuth={0.25} turbidity={12} rayleigh={0.3} mieCoefficient={0.02} mieDirectionalG={0.95} />
      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 320]} />

      {/* NEW DETAILED SWAYING GRASS MESH (Integrated fix) */}
      <instancedMesh ref={grassInstanceRef} args={[detailedGrassGeometry, grassMaterial, grassCount]} castShadow />

      {/* Restored Original Sun Unit */}
      <mesh position={[-10, 45, -180]}>
        <sphereGeometry args={[isMobile ? 18 : 22, 64, 64]} />
        <meshStandardMaterial 
          color="#ffffff" emissive="#ffba5c" emissiveMap={sunPlasmaTex} emissiveIntensity={4}
          transparent={true} opacity={0.7} roughness={0.1} metalness={0.8}
        />
        <pointLight intensity={5} distance={400} color="#fff1d4" decay={1} />
      </mesh>

      {/* Restored Original Dense Cloud System */}
      <group ref={cloudGroupRef}>
        <Cloud position={[-10, 45, -165]} speed={0.5} opacity={0.7} segments={30} bounds={[50, 20, 10]} volume={20} color="#ffd1dc" />
        <Cloud position={[30, 55, -175]} speed={0.4} opacity={0.6} segments={25} bounds={[40, 15, 5]} volume={15} color="#e6e6fa" />
        <Cloud position={[-50, 40, -160]} speed={0.6} opacity={0.5} segments={20} bounds={[60, 20, 10]} volume={18} color="#b0e0e6" />
        <Cloud position={[0, 35, -150]} speed={0.3} opacity={0.4} segments={20} bounds={[100, 10, 10]} volume={12} color="#fce7f3" />
        <Cloud position={[-100, 30, -80]} speed={0.2} opacity={0.5} segments={24} bounds={[80, 20, 20]} volume={20} color="#ffd6f0" />
        <Cloud position={[100, 50, -100]} speed={0.3} opacity={0.4} segments={20} bounds={[120, 30, 30]} volume={15} color="#e9d5ff" />
        <Cloud position={[-20, 75, -140]} speed={0.1} opacity={0.3} segments={15} bounds={[250, 40, 40]} volume={30} color="#ffffff" />
      </group>

      {/* Restored Original Hemisphere/Point Lights */}
      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <directionalLight position={[-15, 30, 10]} intensity={0.1} />
      <pointLight position={[10, 5, 10]} intensity={0.8} color="#ffd6e7" />

      {/* Restored Original Architecture */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        <group position={[-16, -1, 0]}>
          <mesh castShadow receiveShadow position={[1, 8.5, 0]}><boxGeometry args={[4, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[18, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
        <group position={[17, -1, 1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[4, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
          <WallOpening position={[11, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <WallOpening position={[17, 0, 0]} isWindow={true} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}><boxGeometry args={[8, 17, 2]} /><meshStandardMaterial {...pinkProps} /></mesh>
        </group>
      </group>
      
      <ContactShadows position={[12, -1.9, 15]} opacity={0.15} scale={60} blur={4} far={12} />

      {/* Restored Original Infinite Water Plane */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          {
            textureWidth: isMobile ? 512 : 1024,
            textureHeight: isMobile ? 512 : 1024,
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x224455,
            distortionScale: isMobile ? 0.3 : 0.5,
            alpha: 0.8,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}