import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AdvancedSVGData, createAdvancedGeometry } from '../utils/advancedSvgProcessor';

interface AdvancedExtrudedSVGProps {
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
  renderMode: 'extruded' | 'wireframe' | 'curves' | 'combined';
}

const AdvancedExtrudedSVG: React.FC<AdvancedExtrudedSVGProps> = ({ 
  svgData, 
  extrudeSettings, 
  materialSettings,
  renderMode = 'extruded'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  // Enhanced animation with multiple rotation axes
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.2;
      groupRef.current.rotation.x = Math.cos(time * 0.2) * 0.1;
      groupRef.current.rotation.z = Math.sin(time * 0.4) * 0.05;
    }
  });

  console.log('AdvancedExtrudedSVG render - shapes:', svgData?.shapes?.length || 0);

  // Create advanced geometry and materials
  const { geometry, material, wireframeGeometry, curveObjects } = useMemo(() => {
    if (!svgData || !svgData.shapes || svgData.shapes.length === 0) {
      console.log('No SVG data provided to AdvancedExtrudedSVG');
      return { geometry: null, material: null, wireframeGeometry: null, curveObjects: null };
    }

    console.log('Processing advanced SVG data:', {
      shapes: svgData.shapes.length,
      curves: svgData.curves.length,
      renderMode
    });

    // Create main extruded geometry
    const mainGeometry = createAdvancedGeometry(svgData.shapes, extrudeSettings);
    
    // Create wireframe geometry
    const wireframe = new THREE.WireframeGeometry(mainGeometry);
    
    // Create curve objects for curve visualization
    const curveObjects: THREE.Line[] = [];
    if (svgData.curves && svgData.curves.length > 0) {
      svgData.curves.forEach((curve, index) => {
        const points = curve.getPoints(200); // High resolution for smooth curves
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: new THREE.Color().setHSL(index / svgData.curves.length, 0.8, 0.6),
          linewidth: 2
        });
        const line = new THREE.Line(geometry, material);
        curveObjects.push(line);
      });
    }

    // Create enhanced material with multiple properties
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: materialSettings.color,
      metalness: materialSettings.metalness,
      roughness: materialSettings.roughness,
      emissive: materialSettings.emissive,
      emissiveIntensity: materialSettings.emissiveIntensity,
      side: THREE.DoubleSide,
      flatShading: false, // Smooth shading for better curves
    });

    // Add normal mapping for better surface detail
    if (mainGeometry.attributes.normal) {
      mainMaterial.normalMap = null; // Could add normal map texture here
    }

    return { 
      geometry: mainGeometry, 
      material: mainMaterial, 
      wireframeGeometry: wireframe,
      curveObjects 
    };
  }, [svgData, extrudeSettings, materialSettings, renderMode]);

  // Render based on mode
  const renderContent = () => {
    if (!geometry || !material) {
      console.log('No geometry or material, showing fallback');
      return (
        <group ref={groupRef}>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[8, 8, 8]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </group>
      );
    }

    switch (renderMode) {
      case 'extruded':
        return (
          <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            castShadow
            receiveShadow
          />
        );
        
      case 'wireframe':
        return (
          <lineSegments
            ref={wireframeRef}
            geometry={wireframeGeometry}
            material={new THREE.LineBasicMaterial({ color: materialSettings.color })}
          />
        );
        
      case 'curves':
        return (
          <group>
            {curveObjects?.map((curve, index) => (
              <primitive key={index} object={curve} />
            ))}
          </group>
        );
        
      case 'combined':
        return (
          <group>
            <mesh
              ref={meshRef}
              geometry={geometry}
              material={material}
              castShadow
              receiveShadow
            />
            <lineSegments
              ref={wireframeRef}
              geometry={wireframeGeometry}
              material={new THREE.LineBasicMaterial({ 
                color: '#ffffff', 
                opacity: 0.3, 
                transparent: true 
              })}
            />
            {curveObjects?.map((curve, index) => (
              <primitive key={index} object={curve} />
            ))}
          </group>
        );
        
      default:
        return (
          <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            castShadow
            receiveShadow
          />
        );
    }
  };

  console.log('Rendering advanced 3D model with mode:', renderMode);
  return (
    <group ref={groupRef}>
      {renderContent()}
    </group>
  );
};

export default AdvancedExtrudedSVG;
