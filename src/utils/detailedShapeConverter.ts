import * as THREE from 'three';
import { AdvancedSVGData } from './advancedSvgProcessor';

export interface DetailedShapeSettings {
  resolution: number; // Points per curve segment
  extrudeDepth: number;
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  curveSegments: number;
  steps: number;
}

export interface DetailedShapeResult {
  geometry: THREE.ExtrudeGeometry;
  wireframe: THREE.WireframeGeometry;
  curves: THREE.Line[];
  boundingBox: THREE.Box3;
  complexity: number;
  vertexCount: number;
}

// Create high-resolution geometry for detailed viewing
export const createDetailedShape = (
  shape: THREE.Shape,
  settings: DetailedShapeSettings
): DetailedShapeResult => {
  console.log('Creating detailed shape with settings:', settings);

  // Create high-resolution extrude settings
  const extrudeSettings = {
    depth: settings.extrudeDepth,
    bevelEnabled: settings.bevelEnabled,
    bevelThickness: settings.bevelThickness,
    bevelSize: settings.bevelSize,
    bevelOffset: 0,
    bevelSegments: settings.bevelSegments,
    curveSegments: settings.curveSegments,
    steps: settings.steps,
  };

  // Create the main geometry
  const geometry = new THREE.ExtrudeGeometry([shape], extrudeSettings);
  
  // Create wireframe geometry
  const wireframe = new THREE.WireframeGeometry(geometry);
  
  // Create curve visualization
  const curves: THREE.Line[] = [];
  const points = shape.getPoints(settings.resolution);
  
  if (points.length > 2) {
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const curveMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff00,
      linewidth: 2
    });
    const curve = new THREE.Line(curveGeometry, curveMaterial);
    curves.push(curve);
  }

  // Calculate bounding box
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox!.clone();

  // Calculate complexity metrics
  const complexity = points.length + settings.curveSegments * 10;
  const vertexCount = geometry.attributes.position.count;

  console.log('Detailed shape created:', {
    vertexCount,
    complexity,
    boundingBox: boundingBox.getSize(new THREE.Vector3())
  });

  return {
    geometry,
    wireframe,
    curves,
    boundingBox,
    complexity,
    vertexCount
  };
};

// Create detailed geometry for zoomed view
export const createZoomedDetailedGeometry = (
  svgData: AdvancedSVGData,
  shapeIndex: number,
  settings: DetailedShapeSettings
): DetailedShapeResult | null => {
  if (!svgData.individualShapes || shapeIndex >= svgData.individualShapes.length) {
    console.warn('Invalid shape index for detailed geometry');
    return null;
  }

  const individualShape = svgData.individualShapes[shapeIndex];
  console.log('Creating zoomed detailed geometry for shape', shapeIndex, individualShape);

  return createDetailedShape(individualShape.shape, settings);
};

// Analyze shape for zoom optimization
export const analyzeShapeForZoom = (svgData: AdvancedSVGData, shapeIndex: number) => {
  if (!svgData.individualShapes || shapeIndex >= svgData.individualShapes.length) {
    return null;
  }

  const shape = svgData.individualShapes[shapeIndex];
  const boundingBox = shape.boundingBox;
  const complexity = shape.complexity;
  const curveCount = shape.curveCount;

  // Calculate optimal settings based on shape characteristics
  const baseResolution = Math.max(50, Math.min(200, complexity / 10));
  const optimalSettings: DetailedShapeSettings = {
    resolution: baseResolution,
    extrudeDepth: Math.max(0.5, Math.min(5, boundingBox.size.length() / 20)),
    bevelEnabled: curveCount > 5, // Enable bevel for complex shapes
    bevelThickness: curveCount > 10 ? 0.3 : 0.1,
    bevelSize: curveCount > 10 ? 0.2 : 0.05,
    bevelSegments: Math.max(2, Math.min(8, curveCount / 2)),
    curveSegments: Math.max(32, Math.min(128, complexity / 5)),
    steps: Math.max(1, Math.min(4, Math.floor(complexity / 50)))
  };

  console.log('Optimal settings for shape', shapeIndex, ':', optimalSettings);

  return {
    shape,
    optimalSettings,
    analysis: {
      boundingBox,
      complexity,
      curveCount,
      isComplex: complexity > 100,
      hasManyCurves: curveCount > 5,
      size: boundingBox.size.length()
    }
  };
};

// Create multiple detail levels for progressive zoom
export const createProgressiveDetailLevels = (
  svgData: AdvancedSVGData,
  shapeIndex: number
): Array<{ level: number; settings: DetailedShapeSettings; result: DetailedShapeResult }> => {
  const analysis = analyzeShapeForZoom(svgData, shapeIndex);
  if (!analysis) return [];

  const levels = [
    { level: 1, multiplier: 0.5, name: 'Low Detail' },
    { level: 2, multiplier: 1.0, name: 'Medium Detail' },
    { level: 3, multiplier: 2.0, name: 'High Detail' },
    { level: 4, multiplier: 4.0, name: 'Ultra Detail' }
  ];

  return levels.map(({ level, multiplier, name }) => {
    const settings: DetailedShapeSettings = {
      resolution: Math.floor(analysis.optimalSettings.resolution * multiplier),
      extrudeDepth: analysis.optimalSettings.extrudeDepth,
      bevelEnabled: analysis.optimalSettings.bevelEnabled,
      bevelThickness: analysis.optimalSettings.bevelThickness,
      bevelSize: analysis.optimalSettings.bevelSize,
      bevelSegments: analysis.optimalSettings.bevelSegments,
      curveSegments: Math.floor(analysis.optimalSettings.curveSegments * multiplier),
      steps: Math.max(1, Math.floor(analysis.optimalSettings.steps * multiplier))
    };

    const result = createDetailedShape(analysis.shape.shape, settings);
    
    console.log(`Created detail level ${level} (${name}):`, {
      vertexCount: result.vertexCount,
      complexity: result.complexity,
      settings
    });

    return { level, settings, result };
  });
};
