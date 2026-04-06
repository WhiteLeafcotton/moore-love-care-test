import { useRef, useMemo } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import { Environment, Float, ContactShadows, Html } from "@react-three/drei";
import { Water } from "three-stdlib";
import * as THREE from "three";

extend({ Water });

export default function Scene({ isSubmerged, currentView }) {
  const { camera } = useThree();
  const waterRef = useRef();
  const overlayRef = useRef();

  // 🎥 COORDINATES
  const views = {
    home: { pos: [18, 2, 18], look: [0, 0, 0] },     // EXACTLY YOUR ORIGINAL VIEW
    structure: { pos: [-18, 5, 10], look: [10, 2, -10] } // THE QUARTER-TURN POSITION
  };

  // Pre-setting the vectors so we don't create new objects 60 times a second
  const targetPos = useMemo(() => new THREE.Vector3(...views.home.pos), []);
  const targetLook = useMemo(() => new THREE.Vector3(...views.home.look), []);

  const waterNormals = useMemo(() => 
    new THREE.TextureLoader().load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg", (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }), []);

  const distortionMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { time: { value: 0 }, strength: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform float time; uniform float strength; varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          float wave = sin(uv.y * 15.0 + time * 1.5) * 0.01 * strength;
          float ripple = cos(uv.x * 20.0 + time) * 0.01 * strength;
          uv += vec2(wave, ripple);
          gl_FragColor = vec4(vec3(0.05, 0.2, 0.3), 0.2 * strength);
        }
      `,
    });
  }, []);

  useFrame((state, delta) => {
    // 🎥 THE SMOOTH PAN LOGIC
    const currentTarget = views[currentView] || views.home;
    
    // Update target vectors
    targetPos.set(...currentTarget.pos);
    targetLook.set(...currentTarget.look);

    // Glide the camera position (0.03 is slower/more premium, 0.05 is faster)
    camera.position.lerp(targetPos, 0.04);
    
    // Create a smooth "lookAt" transition
    state.camera.lookAt(targetLook);

    // 🌊 ANIMATIONS
    if (waterRef.current) waterRef.current.material.uniforms["time"].value += delta * 0.5;
    if (overlayRef.current) {
      overlayRef.current.material.uniforms.time.value += delta;
      const targetStr = isSubmerged ? 1 : 0;
      overlayRef.current.material.uniforms.strength.value = THREE.MathUtils.lerp(
        overlayRef.current.material.uniforms.strength.value, targetStr, 0.05
      );
    }
  });

  return (
    <>
      <Environment preset="dawn" background blur={0.8} />
      <fog attach="fog" args={["#dcd3d1", 10, 50]} />
      {isSubmerged && <fog attach="fog" args={["#0b1f2a", 2, 25]} />}
      <spotLight position={[20, 20, 10]} intensity={3} castShadow color="#fff4e0" />

      {/* --- 🏠 ORIGINAL STRUCTURE (HOME) --- */}
      <group position={[0, 0, -5]} rotation={[0, -Math.PI / 4, 0]}>
        <group position={[5, 10, -5]}>
          <mesh castShadow><boxGeometry args={[15, 25, 10]} /><meshStandardMaterial color="#ede2df" /></mesh>
          <mesh position={[2, -4, 5.1]}><boxGeometry args={[4, 12, 0.2]} /><meshStandardMaterial color="#b5adaa" /></mesh>
        </group>
        <group position={[-5, 0, 0]}>
          <mesh position={[0, 12.5, -2.5]} castShadow><boxGeometry args={[5, 25, 5]} /><meshStandardMaterial color="#ede2df" /></mesh>
          {[-4, 1].map((z, i) => (
            <mesh key={i} position={[2.6, 8, z]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[4.5, 0.4, 16, 100, Math.PI]} /><meshStandardMaterial color="#dcd3d1" />
            </mesh>
          ))}
        </group>
        <group position={[0, -0.05, 0]}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} position={[0, i * 0.4, i * -1.5]} castShadow>
              <boxGeometry args={[30, 0.25, 2]} /><meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          ))}
        </group>
        <Float speed={1.2} floatIntensity={0.5}>
          <mesh position={[6, 11, -1]}>
            <sphereGeometry args={[3.5, 64, 64]} />
            <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={2} roughness={0.05} iridescence={1} />
          </mesh>
        </Float>
      </group>

      {/* --- 🏗️ THE NEW STRUCTURE (REVEALED ON PAN) --- */}
      <group position={[15, 0, -20]} rotation={[0, Math.PI / 4, 0]}>
        <mesh castShadow position={[0, 7, 0]}>
          <boxGeometry args={[2, 14, 2]} />
          <meshStandardMaterial color="#ede2df" />
        </mesh>
        
        {currentView === 'structure' && (
          <Html position={[0, 6, 6]} center transform distanceFactor={8}>
            <div style={{ color: 'white', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'serif', letterSpacing: '10px', marginBottom: '30px', whiteSpace: 'nowrap' }}>THE COLLECTION</h2>
              <div style={{ display: 'flex', gap: '20px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ width: '130px', height: '190px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '2px' }} />
                ))}
              </div>
            </div>
          </Html>
        )}
      </group>

      {/* --- WATER & EXTRAS --- */}
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(500, 500), {
          textureWidth: 512, textureHeight: 512, waterNormals, 
          sunDirection: new THREE.Vector3(), sunColor: 0xffffff, 
          waterColor: 0xa19791, distortionScale: 3.7, fog: true,
        }]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
      />
      <mesh ref={overlayRef} position={[0, 5, 0]}>
        <planeGeometry args={[200, 200]} />
        <primitive object={distortionMaterial} attach="material" />
      </mesh>
      <ContactShadows opacity={0.2} scale={100} blur={2.5} far={20} />
    </>
  );
}