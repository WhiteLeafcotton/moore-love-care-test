import { MeshReflectorMaterial } from "@react-three/drei";

export default function WaterSurface() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[100, 100]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={15} /* Gives it that clean, mirrored, architectural look */
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#c8c1d9" /* Soft purple/grey water base */
        metalness={0.5}
      />
    </mesh>
  );
}