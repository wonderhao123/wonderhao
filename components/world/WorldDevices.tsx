export function Crane({ step }: { step: number }) {
  return (
    <group position={[73, 4, 30]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[2.2, 0.5, 2.2]} />
        <meshStandardMaterial
          color="#374c60"
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      {[-1, 1].map((i) => (
        <mesh
          key={i}
          position={[i * 0.45, 2.5, 0]}
          rotation={[0, 0, -i * 0.17]}
          castShadow
        >
          <boxGeometry args={[0.1, 4.6, 0.1]} />
          <meshStandardMaterial color="#536d7d" />
        </mesh>
      ))}
      <mesh position={[0.45, 4.7, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#254b61"
          metalness={0.5}
          roughness={0.22}
        />
      </mesh>

      <mesh position={[0, 2.9, 0]} castShadow>
        <boxGeometry args={[0.35, 5.8, 0.35]} />
        <meshStandardMaterial color="#7396ab" />
      </mesh>
      <group rotation={[0, step >= 2 ? Math.PI / 2 : 0, 0]}>
        <mesh position={[1.8, 6.2, 0]} rotation={[0, 0, -0.21]}>
          <boxGeometry args={[4.3, 0.08, 0.08]} />
          <meshStandardMaterial color="#a6c2d5" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[i + 0.2, 6, 0]}>
            <boxGeometry args={[0.06, 0.35, 0.12]} />
            <meshStandardMaterial color="#7396ab" />
          </mesh>
        ))}

        <mesh position={[2, 5.8, 0]} castShadow>
          <boxGeometry args={[4.8, 0.3, 0.3]} />
          <meshStandardMaterial color="#7396ab" />
        </mesh>
        <mesh position={[3.4, step === 1 || step === 2 ? 4.4 : 3.2, 0]}>
          <cylinderGeometry
            args={[0.025, 0.025, step === 1 || step === 2 ? 2.8 : 5.2, 6]}
          />
          <meshStandardMaterial color="#253136" />
        </mesh>
        {step < 3 && (
          <mesh
            position={[3.4, step === 1 || step === 2 ? 2.8 : 0.6, 0]}
            castShadow
          >
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshStandardMaterial color="#ae6439" />
          </mesh>
        )}
      </group>
      {step === 3 && (
        <mesh position={[0, 0.6, -3.4]}>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshStandardMaterial color="#ae6439" />
        </mesh>
      )}
    </group>
  );
}
export function Optical({ value }: { value: number }) {
  return (
    <group position={[-40, 5, 46]} rotation={[0, (value / 100) * Math.PI, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[(i - 1) * 2, 1, 0]}
          rotation={[0.12, (Math.PI * i) / 3, 0]}
          castShadow
        >
          <torusGeometry args={[1, 0.08, 8, 40]} />
          <meshStandardMaterial
            color={["#a78bfa", "#67e8f9", "#c3bbef"][i]}
            metalness={0.45}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
