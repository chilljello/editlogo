import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { renderToString } from 'react-dom/server';

// Component for rendering extruded SVG
const ExtrudedSVG: React.FC<{ paths: THREE.Path[] }> = ({ paths }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01; // Rotate for visibility
    }
  });

  const shapes = paths.map(path => new THREE.Shape(path.getPoints()));
  const extrudeSettings = { depth: 10, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
  const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </mesh>
  );
};

// Main App Component
const App: React.FC = () => {
  const [paths, setPaths] = useState<THREE.Path[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const loader = new SVGLoader();
      const svgData = loader.parse(text);
      setPaths(svgData.paths);
    };
    reader.readAsText(file);
  };

  const exportReactComponent = () => {
    const componentCode = `
import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const ExtrudedSVG: React.FC = () => {
  // Assume paths are hardcoded or passed as props
  const paths = []; // Replace with actual SVG paths data
  const shapes = paths.map(path => new THREE.Shape(path.getPoints()));
  const extrudeSettings = { depth: 10, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
  const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

  return (
    <Canvas>
      <mesh geometry={geometry} material={material}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
};

export default ExtrudedSVG;
    `;
    const blob = new Blob([componentCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ExtrudedSVG.tsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100">
      <div
        className="w-1/2 h-1/2 border-2 border-dashed border-gray-400 flex items-center justify-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          accept=".svg"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
        />
        <p>Drag and drop SVG file here or click to upload</p>
        <button onClick={() => fileInputRef.current?.click()} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">
          Upload
        </button>
      </div>
      {paths.length > 0 && (
        <>
          <Canvas className="w-1/2 h-1/2">
            <ExtrudedSVG paths={paths} />
            <OrbitControls />
          </Canvas>
          <button
            onClick={exportReactComponent}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
          >
            Export React Component
          </button>
        </>
      )}
    </div>
  );
};

export default App;