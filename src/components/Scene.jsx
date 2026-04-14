// -------------------- FLOATING PLATFORM --------------------
const FloatingPlatform = () => (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
    <mesh position={[10, -1.1, 16]} renderOrder={1000}>
      <cylinderGeometry args={[3, 3, 0.25, 64]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.85}
        depthTest={false}
      />
    </mesh>
  </Float>
);

// -------------------- WHOLESOME PLATFORM SCENE --------------------
const PlatformScene = ({ butterProps, BlockHumanoid }) => {
  return (
    <group position={[10, -1.0, 16]}>

      {/* RUG */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <circleGeometry args={[2.0, 64]} />
        <meshStandardMaterial color="#2a1d38" roughness={1} />
      </mesh>

      {/* CHAIR */}
      <group position={[-0.7, 0.25, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#3b2a4d" />
        </mesh>
        <mesh position={[0, 1.1, -0.5]}>
          <boxGeometry args={[1.2, 1.2, 0.2]} />
          <meshStandardMaterial color="#3b2a4d" />
        </mesh>
      </group>

      {/* ELDER (SITTING) */}
      <group position={[-0.7, 0.9, 0]}>
        <BlockHumanoid
          scale={0.8}
          materialProps={butterProps}
          poseProps={{
            leftLegRotation: [Math.PI / 2, 0, 0],
            rightLegRotation: [Math.PI / 2, 0, 0],
            torsoRotationX: 0.25,
            leftArmRotation: [0.5, 0, -0.25],
            rightArmRotation: [0.5, 0, 0.25],
            headRotationY: 0.15
          }}
        />
      </group>

      {/* L-SHAPED LAMP */}
      <group position={[1.2, 0.2, -0.3]}>

        {/* pole */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.5]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        {/* arm */}
        <mesh position={[-0.7, 2.4, 0]}>
          <boxGeometry args={[1.4, 0.05, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        {/* bulb */}
        <mesh position={[-1.4, 2.0, 0]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial
            emissive="#ffdca8"
            emissiveIntensity={2}
            color="#fff3d6"
          />
        </mesh>

        {/* glow light */}
        <pointLight
          position={[-1.4, 2.0, 0]}
          intensity={1.6}
          distance={7}
          color="#ffdca8"
        />
      </group>

      {/* HELPER (SERVING FOOD) */}
      <group position={[0.9, 0.8, 0.3]}>
        <BlockHumanoid
          isHelper
          scale={0.9}
          materialProps={butterProps}
          poseProps={{
            rotation: [0, -0.6, 0],
            leftArmRotation: [-1.2, 0, -0.1],
            rightArmRotation: [-1.2, 0, 0.1]
          }}
        />

        {/* platter */}
        <mesh position={[0, 0.4, 0.6]}>
          <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
          <meshStandardMaterial color="#d8bfae" />
        </mesh>

        {/* food */}
        <mesh position={[0, 0.5, 0.6]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#ff8a8a" />
        </mesh>
      </group>

    </group>
  );
};