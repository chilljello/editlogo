import React from 'react';
import { Canvas } from '@react-three/fiber';

const TestCanvas: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh', background: 'black' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        <mesh position={[3, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default TestCanvas;
