import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { AdvancedSVGData, createAdvancedGeometry } from '../utils/advancedSvgProcessor';
import { 
  createDetailedShape, 
  createZoomedDetailedGeometry, 
  analyzeShapeForZoom,
  createProgressiveDetailLevels,
  DetailedShapeSettings,
  DetailedShapeResult 
} from '../utils/detailedShapeConverter';

interface ZoomableSVGViewerProps {
  svgData: AdvancedSVGData;
  extrudeSettings: {
    depth: number;
    bevelEnabled: boolean;
    bevelThickness: number;
    bevelSize: number;
    bevelOffset: number;
    bevelSegments: number;
  };
  materialSettings: {
    color: string;
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
  };
}

interface ZoomState {
  isZoomed: boolean;
  zoomedShapeIndex: number | null;
  zoomLevel: number;
  originalPosition: THREE.Vector3;
  zoomedPosition: THREE.Vector3;
}

const ZoomableSVGViewer: React.FC<ZoomableSVGViewerProps> = ({
  svgData,
  extrudeSettings,
  materialSettings
}) => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    isZoomed: false,
    zoomedShapeIndex: null,
    zoomLevel: 1,
    originalPosition: new THREE.Vector3(0, 0, 30),
    zoomedPosition: new THREE.Vector3(0, 0, 5)
  });

  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);
  const [showAllShapes, setShowAllShapes] = useState(true);
  const [detailLevel, setDetailLevel] = useState(2);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showCurves, setShowCurves] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.Camera>(null);

  // Animation for zoom transitions
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      if (!zoomState.isZoomed) {
        // Normal rotation when not zoomed
        groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.2;
        groupRef.current.rotation.x = Math.cos(time * 0.2) * 0.1;
      }
    }
  });

  // Create individual shape geometries with detailed analysis
  const shapeGeometries = useMemo(() => {
    if (!svgData || !svgData.shapes) return [];

    return svgData.shapes.map((shape, index) => {
      // Use detailed shape converter for high-quality geometry
      const analysis = analyzeShapeForZoom(svgData, index);
      if (analysis) {
        const detailedResult = createDetailedShape(shape, analysis.optimalSettings);
        return { 
          geometry: detailedResult.geometry, 
          shape, 
          index,
          detailedResult,
          analysis: analysis.analysis
        };
      } else {
        // Fallback to basic geometry
        const geometry = createAdvancedGeometry([shape], extrudeSettings);
        return { geometry, shape, index, detailedResult: null, analysis: null };
      }
    });
  }, [svgData, extrudeSettings, detailLevel]);

  // Handle shape selection
  const handleShapeClick = useCallback((shapeIndex: number) => {
    setSelectedShapeIndex(shapeIndex);
    setZoomState(prev => ({
      ...prev,
      isZoomed: true,
      zoomedShapeIndex: shapeIndex,
      zoomLevel: 3
    }));
  }, []);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      isZoomed: false,
      zoomedShapeIndex: null,
      zoomLevel: 1
    }));
    setSelectedShapeIndex(null);
  }, []);

  // Handle show all shapes
  const handleShowAll = useCallback(() => {
    setShowAllShapes(true);
    setSelectedShapeIndex(null);
    setZoomState(prev => ({
      ...prev,
      isZoomed: false,
      zoomedShapeIndex: null,
      zoomLevel: 1
    }));
  }, []);

  // Create individual shape components with enhanced features
  const ShapeComponent: React.FC<{ 
    geometry: THREE.ExtrudeGeometry; 
    index: number; 
    isSelected: boolean;
    isVisible: boolean;
    detailedResult?: DetailedShapeResult | null;
    analysis?: any;
  }> = ({ geometry, index, isSelected, isVisible, detailedResult, analysis }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const material = useMemo(() => {
      const baseColor = new THREE.Color(materialSettings.color);
      if (isSelected) {
        baseColor.setHSL(0.1, 0.8, 0.6); // Orange for selected
      } else if (hovered) {
        baseColor.setHSL(0.6, 0.8, 0.6); // Blue for hovered
      }

      return new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: materialSettings.metalness,
        roughness: materialSettings.roughness,
        emissive: isSelected ? '#ff6600' : materialSettings.emissive,
        emissiveIntensity: isSelected ? 0.3 : materialSettings.emissiveIntensity,
        side: THREE.DoubleSide,
        flatShading: false,
        transparent: !isVisible,
        opacity: isVisible ? 1 : 0.3
      });
    }, [isSelected, hovered, materialSettings]);

    const wireframeMaterial = useMemo(() => 
      new THREE.LineBasicMaterial({ 
        color: '#ffffff', 
        opacity: 0.3, 
        transparent: true 
      }), []
    );

    return (
      <group>
        {/* Main shape */}
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={material}
          position={[index * 2, 0, 0]} // Spread shapes horizontally
          scale={zoomState.isZoomed && zoomState.zoomedShapeIndex === index ? zoomState.zoomLevel : 1}
          onClick={() => handleShapeClick(index)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
          receiveShadow
        />
        
        {/* Wireframe overlay */}
        {showWireframe && detailedResult?.wireframe && (
          <lineSegments
            geometry={detailedResult.wireframe}
            material={wireframeMaterial}
            position={[index * 2, 0, 0]}
            scale={zoomState.isZoomed && zoomState.zoomedShapeIndex === index ? zoomState.zoomLevel : 1}
          />
        )}
        
        {/* Curve visualization */}
        {showCurves && detailedResult?.curves && (
          <group position={[index * 2, 0, 0]}>
            {detailedResult.curves.map((curve, curveIndex) => (
              <primitive key={curveIndex} object={curve} />
            ))}
          </group>
        )}
      </group>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Zoom Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={handleZoomOut}
          disabled={!zoomState.isZoomed}
          style={{
            padding: '10px 15px',
            backgroundColor: zoomState.isZoomed ? '#ff6600' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: zoomState.isZoomed ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Zoom Out
        </button>
        
        <button
          onClick={handleShowAll}
          style={{
            padding: '10px 15px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Show All Shapes
        </button>

        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            style={{
              padding: '5px 10px',
              backgroundColor: showWireframe ? '#ff6600' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Wireframe
          </button>
          
          <button
            onClick={() => setShowCurves(!showCurves)}
            style={{
              padding: '5px 10px',
              backgroundColor: showCurves ? '#00ff00' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Curves
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label style={{ color: 'white', fontSize: '10px', display: 'block' }}>
            Detail Level: {detailLevel}
          </label>
          <input
            type="range"
            min="1"
            max="4"
            value={detailLevel}
            onChange={(e) => setDetailLevel(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {selectedShapeIndex !== null && (
          <div style={{
            padding: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <div>Selected Shape: {selectedShapeIndex + 1}</div>
            <div>Total Shapes: {shapeGeometries.length}</div>
            <div>Zoom Level: {zoomState.zoomLevel}x</div>
          </div>
        )}
      </div>

      {/* Shape List */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        maxWidth: '200px',
        maxHeight: '300px',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '5px',
        padding: '10px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Shapes ({shapeGeometries.length})</h4>
        {shapeGeometries.map((_, index) => (
          <div
            key={index}
            onClick={() => handleShapeClick(index)}
            style={{
              padding: '5px 10px',
              margin: '2px 0',
              backgroundColor: selectedShapeIndex === index ? '#ff6600' : 'transparent',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              border: '1px solid transparent',
              borderColor: selectedShapeIndex === index ? '#ff6600' : 'rgba(255,255,255,0.2)'
            }}
          >
            Shape {index + 1}
          </div>
        ))}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ 
          position: zoomState.isZoomed ? zoomState.zoomedPosition : zoomState.originalPosition, 
          fov: 50 
        }}
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
        
        <group ref={groupRef}>
          {shapeGeometries.map(({ geometry, index, detailedResult, analysis }) => (
            <ShapeComponent
              key={index}
              geometry={geometry}
              index={index}
              isSelected={selectedShapeIndex === index}
              isVisible={showAllShapes || selectedShapeIndex === index}
              detailedResult={detailedResult}
              analysis={analysis}
            />
          ))}
        </group>
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          maxDistance={100}
          minDistance={1}
        />
      </Canvas>
    </div>
  );
};

export default ZoomableSVGViewer;
