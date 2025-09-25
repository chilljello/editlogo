import React, { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Upload, RotateCcw, Settings, Zap } from 'lucide-react';
import ExtrudedSVG from './components/ExtrudedSVG';
import ZoomableSVGViewer from './components/ZoomableSVGViewer';
import { processSVGFile, SVGData } from './utils/svgProcessor';
import { processAdvancedSVGFile, AdvancedSVGData } from './utils/advancedSvgProcessor';
import SettingsPanel from './components/SettingsPanel';
// import ExportModal from './components/ExportModal';

const App: React.FC = () => {
  const [svgData, setSvgData] = useState<SVGData | null>(null);
  const [advancedSvgData, setAdvancedSvgData] = useState<AdvancedSVGData | null>(null);
  const [useAdvancedProcessor, setUseAdvancedProcessor] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [extrudeSettings, setExtrudeSettings] = useState({
    depth: 10,
    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 3
  });
  const [materialSettings, setMaterialSettings] = useState({
    color: '#aaaaaa',
    metalness: 0.1,
    roughness: 0.3,
    emissive: '#000000',
    emissiveIntensity: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'image/svg+xml') {
      processFile(file);
    }
  }, []);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  }, []);

  const processFile = useCallback(async (file: File) => {
    try {
      if (useAdvancedProcessor) {
        const result = await processAdvancedSVGFile(file);
        
        if (result.success && result.data) {
          setAdvancedSvgData(result.data);
          setSvgData(null); // Clear old data
          console.log('Advanced SVG processed successfully');
        } else {
          console.error('Advanced SVG processing failed:', result.error);
          alert('Error processing SVG file with advanced processor. Please try a different file.');
        }
      } else {
        const result = await processSVGFile(file);
        
        if (result.success && result.data) {
          setSvgData(result.data);
          setAdvancedSvgData(null); // Clear advanced data
          console.log('SVG processed successfully');
        } else {
          console.error('SVG processing failed:', result.error);
          alert('Error processing SVG file. Please try a different file.');
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing SVG file. Please try a different file.');
    }
  }, [useAdvancedProcessor]);

  const resetView = useCallback(() => {
    // This will be handled by the Canvas component
    window.location.reload();
  }, []);

  const createTestGeometry = useCallback(() => {
    console.log('Creating test geometry');
    // Create a simple test path
    const testPath = new THREE.Path();
    testPath.moveTo(-10, -10);
    testPath.lineTo(10, -10);
    testPath.lineTo(10, 10);
    testPath.lineTo(-10, 10);
    testPath.closePath();
    
    console.log('Test path created:', testPath);
    setSvgData({
      paths: [testPath as any], // Cast to any to match interface
      svgString: 'test'
    });
    console.log('SVG data set, should trigger 3D render');
  }, []);

  return (
    <div className="w-full h-screen relative">
      {/* Header - Overlay on top of 3D Canvas */}
      <div className="header-overlay absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <h1 className="title text-2xl font-bold text-white">Logo Editor</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setUseAdvancedProcessor(!useAdvancedProcessor)}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
              useAdvancedProcessor 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={useAdvancedProcessor ? 'Using Advanced Processor' : 'Switch to Advanced Processor'}
          >
            <Zap className="w-4 h-4" />
            {useAdvancedProcessor ? 'Advanced' : 'Basic'}
          </button>
          <button
            onClick={createTestGeometry}
            className="test-button px-4 py-2 text-white rounded-lg text-sm"
            title="Test 3D"
          >
            Test 3D
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="control-button p-2 rounded-lg"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={resetView}
            className="control-button p-2 rounded-lg"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {!svgData && !advancedSvgData ? (
        <div 
          className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-16 h-16 text-white/70 mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">
            Drop your SVG file here
          </h2>
          <p className="text-white/80 mb-6">
            Drag and drop an SVG file to create a 3D extruded model
          </p>
          <input
            type="file"
            accept=".svg"
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="upload-button text-white px-6 py-3 rounded-lg font-medium"
          >
            Choose File
          </button>
        </div>
      ) : (
        <div className="absolute inset-0" style={{ paddingTop: '80px' }}>
          {/* 3D Canvas - Full screen with header overlay */}
          <Canvas
            camera={{ 
              position: [0, 0, 30], 
              fov: 50,
              near: 0.1,
              far: 1000
            }}
            className="three-canvas"
            style={{ 
              width: '100%',
              height: '100%'
            }}
            onCreated={({ gl, scene, camera }) => {
              console.log('Canvas created successfully!');
              console.log('WebGL renderer:', gl);
              console.log('Scene:', scene);
              console.log('Camera position:', camera.position);
              console.log('Camera rotation:', camera.rotation);
            }}
            onError={(error) => {
              console.error('Canvas error:', error);
            }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {advancedSvgData ? (
              <ZoomableSVGViewer 
                svgData={advancedSvgData} 
                extrudeSettings={extrudeSettings}
                materialSettings={materialSettings}
              />
            ) : svgData ? (
              <ExtrudedSVG 
                paths={svgData.paths} 
                extrudeSettings={extrudeSettings}
                materialSettings={materialSettings}
              />
            ) : null}
            
            <OrbitControls />
          </Canvas>
        </div>
      )}

      {/* Settings Panel - temporarily disabled */}
       {showSettings && (
        <SettingsPanel
          extrudeSettings={extrudeSettings}
          materialSettings={materialSettings}
          onExtrudeSettingsChange={setExtrudeSettings}
          onMaterialSettingsChange={setMaterialSettings}
          onClose={() => setShowSettings(false)}
        />
      )} 

      {/* Export Modal - temporarily disabled */}
      {/* {showExportModal && svgData && (
        <ExportModal
          svgData={svgData}
          extrudeSettings={extrudeSettings}
          materialSettings={materialSettings}
          onClose={() => setShowExportModal(false)}
        />
      )} */}
    </div>
  );
};

export default App;
