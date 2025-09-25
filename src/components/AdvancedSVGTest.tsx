import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import AdvancedExtrudedSVG from './AdvancedExtrudedSVG';
import { processAdvancedSVGFile, AdvancedSVGData } from '../utils/advancedSvgProcessor';

const AdvancedSVGTest: React.FC = () => {
  const [svgData, setSvgData] = useState<AdvancedSVGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<'extruded' | 'wireframe' | 'curves' | 'combined'>('extruded');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await processAdvancedSVGFile(file);
      
      if (result.success && result.data) {
        console.log('Advanced SVG processing successful:', result.data);
        setSvgData(result.data);
      } else {
        setError(result.error || 'Failed to process SVG');
      }
    } catch (err) {
      setError(`Error processing SVG: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleSVG = async () => {
    try {
      const response = await fetch('/sample-logo.svg');
      const svgText = await response.text();
      
      // Create a File object from the SVG text
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const file = new File([blob], 'sample-logo.svg', { type: 'image/svg+xml' });
      
      setLoading(true);
      setError(null);
      
      const result = await processAdvancedSVGFile(file);
      
      if (result.success && result.data) {
        console.log('Sample SVG processing successful:', result.data);
        setSvgData(result.data);
      } else {
        setError(result.error || 'Failed to process sample SVG');
      }
    } catch (err) {
      setError(`Error loading sample SVG: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const extrudeSettings = {
    depth: 2,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.1,
    bevelOffset: 0,
    bevelSegments: 3
  };

  const materialSettings = {
    color: '#667eea',
    metalness: 0.8,
    roughness: 0.2,
    emissive: '#000000',
    emissiveIntensity: 0
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Load SVG File'}
        </button>
        
        <button 
          onClick={loadSampleSVG}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#764ba2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Load Sample Logo
        </button>
        
        <select
          value={renderMode}
          onChange={(e) => setRenderMode(e.target.value as any)}
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        >
          <option value="extruded">Extruded</option>
          <option value="wireframe">Wireframe</option>
          <option value="curves">Curves</option>
          <option value="combined">Combined</option>
        </select>
        
        {error && (
          <div style={{ color: 'red', marginLeft: '20px' }}>
            Error: {error}
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 0, 30], fov: 50 }}
          shadows
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Environment preset="studio" />
          
          {svgData && (
            <AdvancedExtrudedSVG
              svgData={svgData}
              extrudeSettings={extrudeSettings}
              materialSettings={materialSettings}
              renderMode={renderMode}
            />
          )}
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* Info Panel */}
      {svgData && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f9f9f9', 
          borderTop: '1px solid #ddd',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <h3>SVG Information</h3>
          <p><strong>Shapes:</strong> {svgData.shapes.length}</p>
          <p><strong>Curves:</strong> {svgData.curves.length}</p>
          <p><strong>ViewBox:</strong> {svgData.metadata.viewBox.width} × {svgData.metadata.viewBox.height}</p>
          <p><strong>Paths:</strong> {svgData.metadata.paths.length}</p>
          
          {svgData.metadata.paths.length > 0 && (
            <div>
              <h4>Path Details:</h4>
              {svgData.metadata.paths.map((path, index) => (
                <div key={index} style={{ marginLeft: '20px', fontSize: '12px' }}>
                  <p><strong>Path {index + 1}:</strong> {path.id}</p>
                  <p><strong>Fill:</strong> {path.fill}</p>
                  <p><strong>Stroke:</strong> {path.stroke}</p>
                  <p><strong>Data:</strong> {path.d.substring(0, 50)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSVGTest;
