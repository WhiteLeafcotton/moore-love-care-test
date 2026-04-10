import { useRef, useMemo, useState, useEffect, forwardRef } from "react";
import { useThree, useFrame, extend, useLoader } from "@react-three/fiber";
import { Environment, Sky, ContactShadows, Cloud } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

/* 🌄 UPDATED HILLS (now ref-enabled) */
const GrassyHills = forwardRef(({ textureMap }, ref) => {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(400, 400, 80, 80);
    const vertices = g.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];

      const dist = Math.sqrt(x * x + y * y);
      const flatZone = 45;
      const smoothZone = 20;

      let influence = 1.0;

      if (dist < flatZone) influence = 0;
      else if (dist < flatZone + smoothZone)
        influence = (dist - flatZone) / smoothZone;

      vertices[i + 2] =
        (Math.sin(x * 0.04) * Math.cos(y * 0.04) * 10 +
          Math.sin(x * 0.08) * 3) *
        influence;
    }

    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh
      ref={ref}
      geometry={geom}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -3.5, -40]}
      receiveShadow
    >
      <meshStandardMaterial
        map={textureMap}
        color="#ffffff"
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
});

/* 🌿 AAA GLASS GRASS */
const GlassGrass = ({ terrainRef, isMobile }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const count = isMobile ? 30000 : 120000;

  const bladeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.12, 1, 1, 4);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const taper = 1 - y;
      pos.setX(i, pos.getX(i) * (0.3 + taper * 0.7));
    }

    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying float vY;

        void main() {
          vY = position.y;
          vec3 pos = position;

          float wind = sin((pos.x * 4.0 + time * 2.0)) * 0.2;
          wind += sin((pos.y * 2.0 + time * 1.5)) * 0.1;

          pos.x += wind * (1.0 - pos.y);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vY;

        void main() {
          vec3 base = mix(
            vec3(0.05, 0.25, 0.1),
            vec3(0.4, 1.0, 0.6),
            vY
          );

          float fresnel = pow(1.0 - vY, 2.0);

          vec3 color = base + vec3(0.6, 1.0, 0.7) * fresnel * 0.5;

          gl_FragColor = vec4(color, 0.65);
        }
      `
    });
  }, []);

  useEffect(() => {
    if (!meshRef.current || !terrainRef.current) return;

    const terrain = terrainRef.current.geometry.attributes.position;
    let placed = 0;

    for (let i = 0; i < count; i++) {
      const id = Math.floor(Math.random() * terrain.count);

      const x = terrain.getX(id);
      const z = terrain.getY(id);
      const y = terrain.getZ(id);

      const dist = Math.sqrt(x * x + z * z);
      if (dist < 45) continue;

      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.rotation.x = Math.random() * 0.15;

      const scale = 0.6 + Math.random() * 0.9;
      dummy.scale.set(1, scale, 1);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(placed++, dummy.matrix);
    }

    meshRef.current.count = placed;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [terrainRef, count, dummy]);

  useFrame((state) => {
    material.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[bladeGeo, material, count]}
      position={[0, -3.5, -40]}
    />
  );
};

/* KEEP YOUR OTHER COMPONENTS EXACTLY THE SAME BELOW */

/* Monolithic Staircase */
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

/* Wall Segment */
const WallOpening = ({ position, colorProps, width = 6, openingW = 3.5, height = 17, openingH = 9, isWindow = false }) => (
  <group position={position}>
    <mesh position={[-(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
    <mesh position={[(openingW + (width - openingW) / 2) / 2, height / 2, 0]}>
      <boxGeometry args={[(width - openingW) / 2, height, 2]} />
      <meshStandardMaterial {...colorProps} />
    </mesh>
  </group>
);

export default function Scene({ currentView }) {
  const { camera, size } = useThree();

  const hillsRef = useRef(); // ✅ NEW

  const isMobile = size.width < 768;
  const baseUrl = import.meta.env.BASE_URL || "/";

  const grassHillsTex = useLoader(
    THREE.TextureLoader,
    `${baseUrl}textures/reference_grass.png`
  );

  return (
    <>
      <Sky />

      {/* ✅ UPDATED TERRAIN + GRASS */}
      <GrassyHills ref={hillsRef} textureMap={grassHillsTex} />
      <GlassGrass terrainRef={hillsRef} isMobile={isMobile} />

      <Environment preset="sunset" />
    </>
  );
}