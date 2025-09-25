import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ImprovedSVGProcessor, ProcessedSVGData } from '../utils/improvedSvgProcessor';

interface SVGViewerProps {
  svgFile?: File;
  svgUrl?: string;
  options?: {
    depth?: number;
    bevelEnabled?: boolean;
    scale?: number;
    autoRotate?: boolean;
    // Enhanced segment controls
    curveSegments?: number;
    bevelSegments?: number;
    steps?: number;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
  };
  onLoad?: (data: ProcessedSVGData) => void;
  onError?: (error: string) => void;
}

// 3D Mesh component for the SVG geometry
const SVGGeometry: React.FC<{
  data: ProcessedSVGData;
  autoRotate?: boolean;
}> = ({ data, autoRotate = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} geometry={data.geometry}>
      {data.materials.map((material, index) => (
        <primitive key={index} object={material} attach={`material-${index}`} />
      ))}
    </mesh>
  );
};

// Loading component
const LoadingSpinner: React.FC = () => (
  <Text position={[0, 0, 0]} fontSize={2} color="white">
    Loading SVG...
  </Text>
);

// Error component
const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <Text position={[0, 0, 0]} fontSize={1} color="red">
    Error: {error}
  </Text>
);

// Main SVG Viewer component
export const ImprovedSVGViewer: React.FC<SVGViewerProps> = ({
  svgFile,
  svgUrl,
  options = {},
  onLoad,
  onError,
}) => {
  const [result, setResult] = useState<ProcessedSVGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processorRef = useRef<ImprovedSVGProcessor | null>(null);

  // Initialize processor with options
  useMemo(() => {
    processorRef.current = new ImprovedSVGProcessor(options);
  }, [JSON.stringify(options)]);

  // Get quality presets
  const getQualityPresets = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    const presets = {
      low: { curveSegments: 32, bevelSegments: 4, steps: 2 },
      medium: { curveSegments: 64, bevelSegments: 6, steps: 3 },
      high: { curveSegments: 128, bevelSegments: 8, steps: 4 },
      ultra: { curveSegments: 256, bevelSegments: 12, steps: 6 },
    };
    return presets[quality];
  };

  // Process SVG when file or URL changes
  React.useEffect(() => {
    const processSVG = async () => {
      if (!processorRef.current) return;

      setLoading(true);
      setError(null);

      try {
        // Apply quality presets if specified
        let finalOptions = { ...options };
        if (options.quality) {
          const presets = getQualityPresets(options.quality);
          finalOptions = { ...finalOptions, ...presets };
        }

        // Update processor options
        processorRef.current.updateOptions(finalOptions);

        let processResult;
        
        if (svgFile) {
          processResult = await processorRef.current.processSVGFile(svgFile);
        } else if (svgUrl) {
          processResult = await processorRef.current.processSVGFromURL(svgUrl);
        } else {
          setLoading(false);
          return;
        }

        if (processResult.success && processResult.data) {
          setResult(processResult.data);
          onLoad?.(processResult.data);
        } else {
          const errorMsg = processResult.error || 'Unknown error occurred';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (svgFile || svgUrl) {
      processSVG();
    }
  }, [svgFile, svgUrl, JSON.stringify(options), onLoad, onError]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 20] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        
        {loading && <LoadingSpinner />}
        {error && <ErrorDisplay error={error} />}
        {result && <SVGGeometry data={result} autoRotate={options.autoRotate} />}
      </Canvas>
      
      {/* Info panel */}
      {result && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          maxWidth: '300px',
        }}>
          <div><strong>Geometry Info:</strong></div>
          <div>Vertices: {result.metadata.totalVertices.toLocaleString()}</div>
          <div>Paths: {result.metadata.pathCount}</div>
          <div>Materials: {result.materials.length}</div>
          <div>ViewBox: {result.metadata.viewBox.width} × {result.metadata.viewBox.height}</div>
          <div style={{ marginTop: '8px' }}>
            <strong>Quality Settings:</strong>
          </div>
          <div>Curve Segments: {options.curveSegments || 128}</div>
          <div>Bevel Segments: {options.bevelSegments || 8}</div>
          <div>Depth Steps: {options.steps || 4}</div>
          {options.quality && <div>Quality: {options.quality}</div>}
        </div>
      )}
    </div>
  );
};

// Hook for using SVG geometry in other components
export const useSVGGeometry = (svgUrl: string, options = {}) => {
  const [result, setResult] = useState<ProcessedSVGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const processSVG = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const processor = new ImprovedSVGProcessor(options);
        const processResult = await processor.processSVGFromURL(svgUrl);
        
        if (processResult.success && processResult.data) {
          setResult(processResult.data);
        } else {
          setError(processResult.error || 'Unknown error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (svgUrl) {
      processSVG();
    }
  }, [svgUrl, JSON.stringify(options)]);

  return { result, loading, error };
};

export default ImprovedSVGViewer;
