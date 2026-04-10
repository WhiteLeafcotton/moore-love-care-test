import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

const GrassyHills = ({ windSpeed = 1.0 }) => {
  const instanceRef = useRef();
  const count = 75000; // High density for the "Unseen" look

  const getHeight = (x, y) => {
    return Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 + Math.sin(x * 0.08) * 3;
  };

  const { geometry, terrainGeom } = useMemo(() => {
    const tg = new THREE.PlaneGeometry(400, 400, 100, 100);
    const pos = tg.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = getHeight(pos[i], pos[i + 1]);
    }
    tg.computeVertexNormals();

    // Use a Star geometry (3 planes) for maximum volume
    const baseG = new THREE.PlaneGeometry(0.18, 1.5, 1, 6);
    baseG.translate(0, 0.75, 0);
    const starGeo = THREE.BufferGeometryUtils.mergeGeometries([
      baseG.clone(),
      baseG.clone().rotateY(Math.PI / 3),
      baseG.clone().rotateY((Math.PI / 3) * 2)
    ]);

    return { geometry: starGeo, terrainGeom: tg };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const root = Math.sqrt(count);
    const spacing = 350 / root;

    for (let i = 0; i < count; i++) {
      const x = (i % root) * spacing - 175 + (Math.random() - 0.5) * spacing;
      const y = Math.floor(i / root) * spacing - 175 + (Math.random() - 0.5) * spacing;
      const z = getHeight(x, y);

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0); 
      // Vary the height scale for that "fluffy" uneven look
      dummy.scale.set(1, 0.5 + Math.random() * 1.2, 1);
      dummy.updateMatrix();
      instanceRef.current.setMatrixAt(i, dummy.matrix);
    }
    instanceRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  const grassMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      roughness: 0.6,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime; varying float vHeight; varying vec3 vWorldPos;` + shader.vertexShader;
      
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        vec3 transformed = vec3(position);
        vHeight = position.y;
        vWorldPos = (instanceMatrix * vec4(position, 1.0)).xyz;

        // Wave logic with spatial noise for "Unseen" style flowing
        float wave = sin(uTime * 1.2 + vWorldPos.x * 0.1 + vWorldPos.z * 0.1) * 0.25;
        wave += cos(uTime * 0.8 + vWorldPos.x * 0.2) * 0.1;
        
        // Bend the top of the blade only
        transformed.x += pow(max(0.0, vHeight), 2.5) * wave;
        transformed.z += pow(max(0.0, vHeight), 2.5) * wave * 0.5;
        `
      );

      shader.fragmentShader = `varying float vHeight; varying vec3 vWorldPos;` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
        #include <color_fragment>
        
        // Define colors based on the "Unseen" aesthetic (soft pastels/warm greens)
        vec3 rootColor = vec3(0.02, 0.1, 0.05);
        vec3 tipColor = vec3(0.6, 0.75, 0.3);
        
        // Add "SSS" (Subsurface Scattering) glow effect
        float glow = pow(vHeight, 2.0) * 1.2;
        vec3 finalColor = mix(rootColor, tipColor, vHeight);
        
        // Subtle noise to vary color per patch
        float noise = sin(vWorldPos.x * 2.0) * cos(vWorldPos.z * 2.0) * 0.1;
        diffuseColor.rgb = finalColor + (glow * 0.15) + noise;
        `
      );
      mat.userData.shader = shader;
    };
    return mat;
  }, []);

  useFrame((state) => {
    if (grassMaterial.userData.shader) {
      grassMaterial.userData.shader.uniforms.uTime.value = state.clock.elapsedTime * windSpeed;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, -20]}>
      <mesh geometry={terrainGeom}>
        <meshStandardMaterial color="#081408" />
      </mesh>
      <instancedMesh ref={instanceRef} args={[geometry, grassMaterial, count]} castShadow />
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. ARCHITECTURAL COMPONENTS (Fixed & Cleaned)                              */
/* -------------------------------------------------------------------------- */

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
            <meshStandardMaterial map={texture} color="#fcd7d7" roughness={0.55} />
          </mesh>
          <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 5, stepDepth]} />
            <meshStandardMaterial map={texture} color="#fcd7d7" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

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

/* -------------------------------------------------------------------------- */
/* 3. MAIN SCENE                                                              */
/* -------------------------------------------------------------------------- */

export default function Scene({ currentView }) {
  const { camera, size } = useThree();
  const waterRef = useRef();
  const cloudGroupRef = useRef();
  const lookAtTarget = useRef(new THREE.Vector3(12, 1.5, 0));
  const baseUrl = import.meta.env.BASE_URL || "/";
  const isMobile = size.width < 768;

  const pinkStoneTex = useLoader(THREE.TextureLoader, `${baseUrl}textures/stone_pillar.jpg`);
  const waterNormals = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg");

  useEffect(() => {
    if (pinkStoneTex) {
      pinkStoneTex.wrapS = pinkStoneTex.wrapT = THREE.RepeatWrapping;
      pinkStoneTex.repeat.set(2, 2);
    }
  }, [pinkStoneTex]);

  const pinkProps = { map: pinkStoneTex, color: "#fcd7d7", roughness: 0.65, metalness: 0.05 };

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
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 1.8;
      if (cloudGroupRef.current.position.x > 180) cloudGroupRef.current.position.x = -180;
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[-10, 6, -100]} inclination={0.49} azimuth={0.25} turbidity={12} rayleigh={0.3} />
      
      <GrassyHills windSpeed={0.8} />

      <Environment preset="sunset" />
      <fog attach="fog" args={["#ffc0e6", 15, 320]} />

      <mesh position={[-10, 45, -180]}>
        <sphereGeometry args={[isMobile ? 18 : 22, 64, 64]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffba5c" emissiveIntensity={4} transparent opacity={0.7} />
        <pointLight intensity={5} distance={400} color="#fff1d4" />
      </mesh>

      <group ref={cloudGroupRef}>
        <Cloud position={[-10, 45, -165]} opacity={0.7} segments={30} bounds={[50, 20, 10]} volume={20} color="#ffd1dc" />
        <Cloud position={[30, 55, -175]} opacity={0.6} segments={25} bounds={[40, 15, 5]} volume={15} color="#e6e6fa" />
      </group>

      <hemisphereLight intensity={1.5} color="#ffffff" groundColor="#ffc0e6" />
      <pointLight position={[10, 5, 10]} intensity={0.8} color="#ffd6e7" />

      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[12, -2.0, 15]}>
          <boxGeometry args={[14, 8.0, 28]} />
          <meshStandardMaterial {...pinkProps} />
        </mesh>
        <Staircase position={[5.0, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]} width={20} texture={pinkStoneTex} />
        <group position={[-16, -1, 0]}>
          <WallOpening position={[6, 0, 0]} colorProps={pinkProps} />
          <WallOpening position={[12, 0, 0]} colorProps={pinkProps} />
          <mesh castShadow receiveShadow position={[24, 8.5, 0]}>
            <boxGeometry args={[18, 17, 2]} />
            <meshStandardMaterial {...pinkProps} />
          </mesh>
        </group>
      </group>
      
      <ContactShadows position={[12, -1.9, 15]} opacity={0.15} scale={60} blur={4} far={12} />

      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(2000, 2000),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(-10, 45, -180).normalize(),
            sunColor: 0xffffff,
            waterColor: 0x224455,
            distortionScale: 0.4,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      />
    </>
  );
}