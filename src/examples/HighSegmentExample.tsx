import React, { useState } from 'react';
import { ImprovedSVGViewer } from '../components/ImprovedSVGViewer';

/**
 * Example demonstrating high-segment SVG geometry
 * Shows different quality levels and segment controls
 */
export const HighSegmentExample: React.FC = () => {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [customSegments, setCustomSegments] = useState({
    curveSegments: 128,
    bevelSegments: 8,
    steps: 4,
  });

  const handleLoad = (data: any) => {
    console.log('Loaded geometry with', data.metadata.totalVertices, 'vertices');
  };

  const handleError = (error: string) => {
    console.error('SVG processing error:', error);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls Panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 1000,
        minWidth: '250px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Segment Controls</h3>
        
        {/* Quality Preset */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Quality Preset:</label>
          <select 
            value={quality} 
            onChange={(e) => setQuality(e.target.value as any)}
            style={{ width: '100%', padding: '5px', borderRadius: '4px' }}
          >
            <option value="low">Low (32 segments)</option>
            <option value="medium">Medium (64 segments)</option>
            <option value="high">High (128 segments)</option>
            <option value="ultra">Ultra (256 segments)</option>
          </select>
        </div>

        {/* Custom Segment Controls */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Custom Segments:</label>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px' }}>Curve Segments: {customSegments.curveSegments}</label>
            <input
              type="range"
              min="16"
              max="512"
              step="16"
              value={customSegments.curveSegments}
              onChange={(e) => setCustomSegments(prev => ({ ...prev, curveSegments: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px' }}>Bevel Segments: {customSegments.bevelSegments}</label>
            <input
              type="range"
              min="2"
              max="24"
              step="2"
              value={customSegments.bevelSegments}
              onChange={(e) => setCustomSegments(prev => ({ ...prev, bevelSegments: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px' }}>Depth Steps: {customSegments.steps}</label>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={customSegments.steps}
              onChange={(e) => setCustomSegments(prev => ({ ...prev, steps: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Performance Warning */}
        {customSegments.curveSegments > 256 && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.2)',
            border: '1px solid orange',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '12px',
            marginTop: '10px',
          }}>
            ⚠️ High segment count may impact performance
          </div>
        )}
      </div>

      {/* SVG Viewer */}
      <ImprovedSVGViewer
        svgUrl="/oyu.svg" // Using the SVG from the svg-to-3d example
        options={{
          depth: 15,
          bevelEnabled: true,
          bevelThickness: 3,
          bevelSize: 2,
          scale: 1.2,
          autoRotate: true,
          quality: quality,
          ...customSegments,
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default HighSegmentExample;
