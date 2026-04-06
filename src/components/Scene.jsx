import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Float, ContactShadows } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ isSubmerged }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const overlayRef = useRef();

  const waterNormals = useMemo(
    () =>
      new THREE.TextureLoader().load(
        "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg",
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
    []
  );

  // 🌊 Distortion shader (VERY subtle, luxury feel)
  const distortionMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        strength: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float strength;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;

          float wave = sin(uv.y * 15.0 + time * 1.5) * 0.01 * strength;
          float ripple = cos(uv.x * 20.0 + time) * 0.01 * strength;

          uv += vec2(wave, ripple);

          vec3 color = vec3(0.05, 0.2, 0.3);

          gl_FragColor = vec4(color, 0.2 * strength);
        }
      `,
    });
  }, []);

  useFrame((state, delta) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms["time"].value += delta * 0.5;
    }

    // animate distortion
    if (overlayRef.current) {
      overlayRef.current.material.uniforms.time.value += delta;

      const target = isSubmerged ? 1 : 0;

      overlayRef.current.material.uniforms.strength.value =
        THREE.MathUtils.lerp(
          overlayRef.current.material.uniforms.strength.value,
          target,
          0.05
        );
    }
  });

  return (
    <>
      <Environment preset="dawn" background blur={0.8} />

      {/* ORIGINAL FOG (unchanged) */}
      <fog attach="fog" args={["#dcd3d1", 10, 50]} />

      {/* 🌊 Underwater fog (adds only when submerged) */}
      {isSubmerged && <fog attach="fog" args={["#0b1f2a", 2, 25]} />}

      <spotLight
        position={[20, 20, 10]}
        angle={0.15}
        penumbra={1}
        intensity={3}
        castShadow
        color="#fff4e0"
      />

      {/* YOUR STRUCTURE (UNCHANGED) */}
      <group position={[0, 0, -5]} rotation={[0, -Math.PI / 4, 0]}>
        <group position={[5, 10, -5]}>
          <mesh castShadow>
            <boxGeometry args={[15, 25, 10]} />
            <meshStandardMaterial color="#ede2df" />
          </mesh>

          <mesh position={[2, -4, 5.1]}>
            <boxGeometry args={[4, 12, 0.2]} />
            <meshStandardMaterial color="#b5adaa" />
          </mesh>
        </group>

        <group position={[-5, 0, 0]}>
          <mesh position={[0, 12.5, -2.5]} castShadow>
            <boxGeometry args={[5, 25, 5]} />
            <meshStandardMaterial color="#ede2df" />
          </mesh>

          {[-4, 1].map((z, i) => (
            <mesh key={i} position={[2.6, 8, z]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[4.5, 0.4, 16, 100, Math.PI]} />
              <meshStandardMaterial color="#dcd3d1" />
            </mesh>
          ))}
        </group>

        <group position={[0, -0.05, 0]}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} position={[0, i * 0.4, i * -1.5]} castShadow>
              <boxGeometry args={[30, 0.25, 2]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          ))}
        </group>

        <Float speed={1.2} floatIntensity={0.5}>
          <mesh position={[6, 11, -1]}>
            <sphereGeometry args={[3.5, 64, 64]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transmission={1}
              thickness={2}
              roughness={0.05}
              iridescence={1}
            />
          </mesh>
        </Float>
      </group>

      {/* WATER */}
      <water
        ref={waterRef}
        args={[
          new THREE.PlaneGeometry(100, 100),
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: waterNormals,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0xa19791,
            distortionScale: 3.7,
            fog: true,
          },
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />

      {/* 🌊 REFRACTION OVERLAY */}
      <mesh ref={overlayRef} position={[0, 5, 0]}>
        <planeGeometry args={[200, 200]} />
        <primitive object={distortionMaterial} attach="material" />
      </mesh>

      <ContactShadows opacity={0.2} scale={100} blur={2.5} far={20} />
    </>
  );
}