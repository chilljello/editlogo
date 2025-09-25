import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExtrudedSVGProps {
  paths: THREE.Path[];
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

const ExtrudedSVG: React.FC<ExtrudedSVGProps> = ({ 
  paths, 
  extrudeSettings, 
  materialSettings 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Auto-rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  console.log('ExtrudedSVG render - paths:', paths?.length || 0);

  // Create geometry and material
  const { geometry, material } = useMemo(() => {
    if (!paths || paths.length === 0) {
      console.log('No paths provided to ExtrudedSVG');
      return { geometry: null, material: null };
    }

    console.log('Processing paths:', paths.length);

    // Convert paths to shapes
    const shapes = paths.map((path, index) => {
      console.log(`Processing path ${index}:`, path);
      
      const shape = new THREE.Shape();
      
      try {
        // Try to get points from the path
        const points = path.getPoints ? path.getPoints() : [];
        console.log(`Path ${index} has ${points.length} points`);
        
        if (points.length > 0) {
          shape.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
          }
          shape.closePath();
        } else {
          // Create a simple fallback shape if no points
          console.log('Creating fallback shape for empty path');
          shape.moveTo(-10, -10);
          shape.lineTo(10, -10);
          shape.lineTo(10, 10);
          shape.lineTo(-10, 10);
          shape.closePath();
        }
      } catch (error) {
        console.error(`Error processing path ${index}:`, error);
        // Create a simple fallback shape
        shape.moveTo(-10, -10);
        shape.lineTo(10, -10);
        shape.lineTo(10, 10);
        shape.lineTo(-10, 10);
        shape.closePath();
      }
      
      return shape;
    });

    // Create extrude settings
    const settings = {
      depth: extrudeSettings.depth,
      bevelEnabled: extrudeSettings.bevelEnabled,
      bevelThickness: extrudeSettings.bevelThickness,
      bevelSize: extrudeSettings.bevelSize,
      bevelOffset: extrudeSettings.bevelOffset,
      bevelSegments: extrudeSettings.bevelSegments,
    };

    // Create geometry
    console.log('Creating geometry with shapes:', shapes.length);
    const geometry = new THREE.ExtrudeGeometry(shapes, settings);
    console.log('Geometry created, vertices:', geometry.attributes.position.count);
    
    // Center the geometry
    geometry.computeBoundingBox();
    const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);

    // Scale to fit in view
    const size = geometry.boundingBox!.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 20 / maxDimension;
    console.log('Scaling geometry by:', scale);
    geometry.scale(scale, scale, scale);

    // Create material with enhanced properties
    const material = new THREE.MeshStandardMaterial({
      color: materialSettings.color,
      metalness: materialSettings.metalness,
      roughness: materialSettings.roughness,
      emissive: materialSettings.emissive,
      emissiveIntensity: materialSettings.emissiveIntensity,
      side: THREE.DoubleSide,
    });

    return { geometry, material };
  }, [paths, extrudeSettings, materialSettings]);

  // Always show something for debugging
  console.log('Rendering ExtrudedSVG component');
  
  if (!geometry || !material) {
    console.log('No geometry or material, showing fallback cube');
    // Show a fallback cube to test 3D rendering
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 8, 8]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <mesh position={[15, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[4, 16, 16]} />
          <meshStandardMaterial color="green" />
        </mesh>
      </group>
    );
  }

  console.log('Rendering 3D model with geometry and material');
  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />
    </group>
  );
};

export default ExtrudedSVG;
