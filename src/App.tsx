import React, { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from 'three';
import { Upload, Download, RotateCcw, Settings } from 'lucide-react';
import ExtrudedSVG from './components/ExtrudedSVG';
// import ExportModal from './components/ExportModal';
// import SettingsPanel from './components/SettingsPanel';

interface SVGData {
  paths: any[]; // SVGResultPaths from SVGLoader
  svgString: string;
}

const App: React.FC = () => {
  const [svgData, setSvgData] = useState<SVGData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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

  // Simple SVG path parser
  const parseSVGPath = (pathData: string, path: THREE.Path) => {
    console.log('Parsing SVG path:', pathData);
    
    // Split the path data into commands
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    console.log('Path commands:', commands);
    
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    
    for (const command of commands) {
      const type = command[0];
      const coords = command.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
      
      switch (type.toLowerCase()) {
        case 'm': // Move to (relative)
          currentX += coords[0] || 0;
          currentY += coords[1] || 0;
          if (type === 'M') { // Absolute move
            currentX = coords[0] || 0;
            currentY = coords[1] || 0;
          }
          path.moveTo(currentX, currentY);
          startX = currentX;
          startY = currentY;
          break;
          
        case 'l': // Line to (relative)
          if (coords.length >= 2) {
            currentX += coords[0];
            currentY += coords[1];
            if (type === 'L') { // Absolute line
              currentX = coords[0];
              currentY = coords[1];
            }
            path.lineTo(currentX, currentY);
          }
          break;
          
        case 'h': // Horizontal line
          currentX += coords[0] || 0;
          if (type === 'H') { // Absolute horizontal
            currentX = coords[0] || 0;
          }
          path.lineTo(currentX, currentY);
          break;
          
        case 'v': // Vertical line
          currentY += coords[0] || 0;
          if (type === 'V') { // Absolute vertical
            currentY = coords[0] || 0;
          }
          path.lineTo(currentX, currentY);
          break;
          
        case 'z': // Close path
          path.closePath();
          currentX = startX;
          currentY = startY;
          break;
          
        default:
          console.log(`Unsupported SVG command: ${type}`);
          // For unsupported commands, create a simple line
          if (coords.length >= 2) {
            currentX = coords[0];
            currentY = coords[1];
            path.lineTo(currentX, currentY);
          }
          break;
      }
    }
    
    // Ensure the path is closed
    if (!pathData.includes('Z') && !pathData.includes('z')) {
      path.closePath();
    }
    
    console.log('Parsed path completed');
  };

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

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log('SVG file content:', text.substring(0, 200) + '...');
      
      const loader = new SVGLoader();
      try {
        const svgData = loader.parse(text);
        console.log('SVG Data structure:', svgData);
        console.log('Paths found:', svgData.paths?.length || 0);
        console.log('First path:', svgData.paths?.[0]);
        
        if (!svgData.paths || svgData.paths.length === 0) {
          console.warn('No paths found in SVG, creating fallback geometry');
          // Create a simple fallback geometry
          const fallbackPath = new THREE.Path();
          fallbackPath.moveTo(-10, -10);
          fallbackPath.lineTo(10, -10);
          fallbackPath.lineTo(10, 10);
          fallbackPath.lineTo(-10, 10);
          fallbackPath.closePath();
          
          setSvgData({
            paths: [fallbackPath],
            svgString: text
          });
        } else {
          console.log('SVG paths found, processing...');
          
          // The SVGLoader already creates THREE.Path objects
          // We can use them directly or convert them properly
          const threePaths = svgData.paths.map((svgPath: any, index: number) => {
            console.log(`Processing SVG path ${index}:`, svgPath);
            
            try {
              // Check if it's already a THREE.Path with getPoints method
              if (svgPath && typeof svgPath.getPoints === 'function') {
                console.log(`Using existing THREE.Path for path ${index}`);
                const points = svgPath.getPoints();
                console.log(`Path ${index} has ${points.length} points`);
                
                if (points.length > 0) {
                  return svgPath;
                } else {
                  // Create a fallback path if no points
                  const fallbackPath = new THREE.Path();
                  fallbackPath.moveTo(-10, -10);
                  fallbackPath.lineTo(10, -10);
                  fallbackPath.lineTo(10, 10);
                  fallbackPath.lineTo(-10, 10);
                  fallbackPath.closePath();
                  return fallbackPath;
                }
              } else {
                // Create a new THREE.Path from the SVG data
                console.log(`Creating new THREE.Path for path ${index}`);
                const newPath = new THREE.Path();
                
                // Try to extract path data from userData
                if (svgPath.userData && svgPath.userData.node) {
                  const node = svgPath.userData.node;
                  console.log('SVG node data:', node);
                  
                  // Try to get the 'd' attribute (path data)
                  if (node.getAttribute) {
                    const pathData = node.getAttribute('d');
                    console.log('Path data:', pathData);
                    
                    if (pathData) {
                      // Parse the SVG path data and create THREE.Path
                      try {
                        console.log('Parsing SVG path data:', pathData);
                        parseSVGPath(pathData, newPath);
                      } catch (parseError) {
                        console.error('Error parsing path data:', parseError);
                        // Fallback to simple square
                        newPath.moveTo(-8, -8);
                        newPath.lineTo(8, -8);
                        newPath.lineTo(8, 8);
                        newPath.lineTo(-8, 8);
                        newPath.closePath();
                      }
                    } else {
                      // No path data, create a simple square
                      newPath.moveTo(-8, -8);
                      newPath.lineTo(8, -8);
                      newPath.lineTo(8, 8);
                      newPath.lineTo(-8, 8);
                      newPath.closePath();
                    }
                  } else {
                    // No node data, create a simple square
                    newPath.moveTo(-8, -8);
                    newPath.lineTo(8, -8);
                    newPath.lineTo(8, 8);
                    newPath.lineTo(-8, 8);
                    newPath.closePath();
                  }
                } else {
                  // No userData, create a simple square
                  newPath.moveTo(-8, -8);
                  newPath.lineTo(8, -8);
                  newPath.lineTo(8, 8);
                  newPath.lineTo(-8, 8);
                  newPath.closePath();
                }
                
                return newPath;
              }
            } catch (error) {
              console.error(`Error processing SVG path ${index}:`, error);
              // Create a simple square as fallback
              const fallbackPath = new THREE.Path();
              fallbackPath.moveTo(-8, -8);
              fallbackPath.lineTo(8, -8);
              fallbackPath.lineTo(8, 8);
              fallbackPath.lineTo(-8, 8);
              fallbackPath.closePath();
              return fallbackPath;
            }
          });
          
          console.log('Converted paths:', threePaths);
          setSvgData({
            paths: threePaths,
            svgString: text
          });
        }
      } catch (error) {
        console.error('Error parsing SVG:', error);
        console.log('Creating fallback geometry due to parsing error');
        
        // Create fallback geometry
        const fallbackPath = new THREE.Path();
        fallbackPath.moveTo(-10, -10);
        fallbackPath.lineTo(10, -10);
        fallbackPath.lineTo(10, 10);
        fallbackPath.lineTo(-10, 10);
        fallbackPath.closePath();
        
        setSvgData({
          paths: [fallbackPath],
          svgString: text
        });
      }
    };
    reader.readAsText(file);
  }, []);

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
      {!svgData ? (
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
            camera={{ position: [0, 0, 20], fov: 50 }}
            className="three-canvas"
            style={{ 
              width: '100%',
              height: '100%'
            }}
            onCreated={({ gl, scene, camera }) => {
              console.log('Canvas created successfully!');
              console.log('WebGL renderer:', gl);
              console.log('Scene:', scene);
              console.log('Camera:', camera);
            }}
            onError={(error) => {
              console.error('Canvas error:', error);
            }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {/* Always show basic shapes for testing */}
            <mesh position={[-5, 0, 0]} onUpdate={() => console.log('Red cube rendered')}>
              <boxGeometry args={[3, 3, 3]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[5, 0, 0]} onUpdate={() => console.log('Yellow sphere rendered')}>
              <sphereGeometry args={[2, 16, 16]} />
              <meshStandardMaterial color="yellow" />
            </mesh>
            <mesh position={[0, 5, 0]} onUpdate={() => console.log('Purple cone rendered')}>
              <coneGeometry args={[2, 4, 8]} />
              <meshStandardMaterial color="purple" />
            </mesh>
            
            <ExtrudedSVG 
              paths={svgData.paths} 
              extrudeSettings={extrudeSettings}
              materialSettings={materialSettings}
            />
            
            <OrbitControls />
          </Canvas>
        </div>
      )}

      {/* Settings Panel - temporarily disabled */}
      {/* {showSettings && (
        <SettingsPanel
          extrudeSettings={extrudeSettings}
          materialSettings={materialSettings}
          onExtrudeSettingsChange={setExtrudeSettings}
          onMaterialSettingsChange={setMaterialSettings}
          onClose={() => setShowSettings(false)}
        />
      )} */}

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
