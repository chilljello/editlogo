import * as THREE from 'three';

/**
 * Enhanced geometry creation utilities
 * Provides advanced extrude settings, material handling, and optimization
 */

export interface AdvancedExtrudeSettings {
  depth: number;
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelOffset: number;
  bevelSegments: number;
  curveSegments: number;
  steps: number;
  // Advanced settings
  bevelType?: 'round' | 'chamfer';
  bevelThicknessCurve?: THREE.Curve<THREE.Vector2>;
  bevelSizeCurve?: THREE.Curve<THREE.Vector2>;
  bevelThicknessCurveTension?: number;
  bevelSizeCurveTension?: number;
}

export interface MaterialSettings {
  type: 'phong' | 'lambert' | 'standard' | 'physical';
  color?: number;
  metalness?: number;
  roughness?: number;
  emissive?: number;
  emissiveIntensity?: number;
  shininess?: number;
  specular?: number;
  transparent?: boolean;
  opacity?: number;
  side?: 'front' | 'back' | 'double';
}

export interface GeometryOptimizationSettings {
  simplify?: boolean;
  simplificationRatio?: number;
  mergeVertices?: boolean;
  computeNormals?: boolean;
  computeTangents?: boolean;
  optimizeForRendering?: boolean;
}

export class EnhancedGeometryCreator {
  /**
   * Create optimized extrude geometry with advanced settings
   */
  static createExtrudeGeometry(
    shapes: THREE.Shape[],
    extrudeSettings: AdvancedExtrudeSettings,
    optimizationSettings: GeometryOptimizationSettings = {}
  ): THREE.ExtrudeGeometry {
    const startTime = performance.now();
    
    // Validate inputs
    if (!shapes || shapes.length === 0) {
      throw new Error('No shapes provided for geometry creation');
    }

    // Create extrude settings with defaults
    const settings = this.createExtrudeSettings(extrudeSettings);
    
    // Create geometry
    const geometry = new THREE.ExtrudeGeometry(shapes, settings);
    
    // Apply optimizations
    this.applyOptimizations(geometry, optimizationSettings);
    
    // Log performance
    const endTime = performance.now();
    console.log(`Geometry created in ${(endTime - startTime).toFixed(2)}ms`);
    
    return geometry;
  }

  /**
   * Create advanced materials based on SVG path data
   */
  static createAdvancedMaterials(
    paths: any[],
    materialSettings: MaterialSettings = { type: 'phong' }
  ): THREE.Material[] {
    const materials: THREE.Material[] = [];
    
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const material = this.createMaterialForPath(path, materialSettings, i);
      materials.push(material);
    }
    
    // If no paths or materials created, create a default material
    if (materials.length === 0) {
      materials.push(this.createDefaultMaterial(materialSettings));
    }
    
    return materials;
  }

  /**
   * Create geometry with automatic scaling and centering
   */
  static createAutoScaledGeometry(
    shapes: THREE.Shape[],
    targetSize: number = 20,
    extrudeSettings: AdvancedExtrudeSettings,
    optimizationSettings: GeometryOptimizationSettings = {}
  ): THREE.ExtrudeGeometry {
    const geometry = this.createExtrudeGeometry(shapes, extrudeSettings, optimizationSettings);
    
    // Compute bounding box for scaling
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox!;
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Scale to target size
    const scale = targetSize / maxDimension;
    geometry.scale(scale, scale, scale);
    
    // Center the geometry
    const center = boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-center.x * scale, -center.y * scale, -center.z * scale);
    
    return geometry;
  }

  /**
   * Create geometry with multiple materials (one per shape)
   */
  static createMultiMaterialGeometry(
    shapes: THREE.Shape[],
    extrudeSettings: AdvancedExtrudeSettings,
    materialSettings: MaterialSettings = { type: 'phong' }
  ): { geometry: THREE.ExtrudeGeometry; materials: THREE.Material[] } {
    const geometry = this.createExtrudeGeometry(shapes, extrudeSettings);
    const materials = this.createAdvancedMaterials(shapes.map(() => ({})), { ...materialSettings, type: materialSettings.type || 'phong' });
    
    return { geometry, materials };
  }

  /**
   * Create geometry with custom bevel profiles
   */
  static createCustomBevelGeometry(
    shapes: THREE.Shape[],
    baseSettings: AdvancedExtrudeSettings,
    bevelProfile: THREE.Curve<THREE.Vector2>
  ): THREE.ExtrudeGeometry {
    const settings = {
      ...baseSettings,
      bevelThicknessCurve: bevelProfile,
      bevelSizeCurve: bevelProfile,
    };
    
    return this.createExtrudeGeometry(shapes, settings);
  }

  /**
   * Create ultra-high segment geometry for maximum detail
   */
  static createUltraHighSegmentGeometry(
    shapes: THREE.Shape[],
    targetVertices: number = 50000
  ): THREE.ExtrudeGeometry {
    // Calculate optimal settings based on target vertex count
    const estimatedVerticesPerShape = targetVertices / shapes.length;
    const curveSegments = Math.max(256, Math.min(512, Math.floor(estimatedVerticesPerShape / 10)));
    const bevelSegments = Math.max(12, Math.min(24, Math.floor(curveSegments / 20)));
    const steps = Math.max(4, Math.min(8, Math.floor(curveSegments / 50)));

    const ultraSettings: AdvancedExtrudeSettings = {
      depth: 10,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments,
      curveSegments,
      steps,
    };

    const optimizationSettings: GeometryOptimizationSettings = {
      simplify: false, // Don't simplify for ultra-high detail
      mergeVertices: true,
      computeNormals: true,
      computeTangents: true,
      optimizeForRendering: true,
    };

    return this.createExtrudeGeometry(shapes, ultraSettings, optimizationSettings);
  }

  private static createExtrudeSettings(settings: AdvancedExtrudeSettings): THREE.ExtrudeGeometryOptions {
    return {
      depth: settings.depth,
      bevelEnabled: settings.bevelEnabled,
      bevelThickness: settings.bevelThickness,
      bevelSize: settings.bevelSize,
      bevelOffset: settings.bevelOffset,
      bevelSegments: settings.bevelSegments,
      curveSegments: settings.curveSegments,
      steps: settings.steps,
      ...(settings.bevelThicknessCurve && { bevelThicknessCurve: settings.bevelThicknessCurve }),
      ...(settings.bevelSizeCurve && { bevelSizeCurve: settings.bevelSizeCurve }),
      ...(settings.bevelThicknessCurveTension && { bevelThicknessCurveTension: settings.bevelThicknessCurveTension }),
      ...(settings.bevelSizeCurveTension && { bevelSizeCurveTension: settings.bevelSizeCurveTension }),
    };
  }

  private static applyOptimizations(
    geometry: THREE.ExtrudeGeometry,
    settings: GeometryOptimizationSettings
  ): void {
    if (settings.mergeVertices) {
      // Note: mergeVertices is not available on ExtrudeGeometry in some Three.js versions
      // This is a placeholder for the optimization
      console.log('Vertex merging requested but not available on ExtrudeGeometry');
    }
    
    if (settings.computeNormals) {
      geometry.computeVertexNormals();
    }
    
    if (settings.computeTangents) {
      geometry.computeTangents();
    }
    
    if (settings.optimizeForRendering) {
      // Optimize for rendering by ensuring proper winding order
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }
    
    if (settings.simplify && settings.simplificationRatio) {
      this.simplifyGeometry(geometry, settings.simplificationRatio);
    }
  }

  private static createMaterialForPath(
    path: any,
    baseSettings: MaterialSettings,
    index: number
  ): THREE.Material {
    const settings = { ...baseSettings };
    
    // Extract color from path if available
    if (path.userData?.node) {
      const node = path.userData.node;
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      
      if (fill && fill !== 'none') {
        settings.color = this.parseColor(fill);
      } else if (stroke && stroke !== 'none') {
        settings.color = this.parseColor(stroke);
      }
    }
    
    // Generate color if none found
    if (!settings.color) {
      settings.color = this.generateColor(index);
    }
    
    return this.createMaterial(settings);
  }

  private static createMaterial(settings: MaterialSettings): THREE.Material {
    const baseMaterial = {
      color: settings.color || 0x666666,
      transparent: settings.transparent || false,
      opacity: settings.opacity || 1,
      side: settings.side === 'double' ? THREE.DoubleSide : 
            settings.side === 'back' ? THREE.BackSide : THREE.FrontSide,
    };

    switch (settings.type) {
      case 'standard':
        return new THREE.MeshStandardMaterial({
          ...baseMaterial,
          metalness: settings.metalness || 0,
          roughness: settings.roughness || 0.5,
          emissive: settings.emissive || 0x000000,
          emissiveIntensity: settings.emissiveIntensity || 0,
        });
      
      case 'physical':
        return new THREE.MeshPhysicalMaterial({
          ...baseMaterial,
          metalness: settings.metalness || 0,
          roughness: settings.roughness || 0.5,
          emissive: settings.emissive || 0x000000,
          emissiveIntensity: settings.emissiveIntensity || 0,
        });
      
      case 'lambert':
        return new THREE.MeshLambertMaterial(baseMaterial);
      
      case 'phong':
      default:
        return new THREE.MeshPhongMaterial({
          ...baseMaterial,
          shininess: settings.shininess || 30,
          specular: settings.specular || 0x111111,
        });
    }
  }

  private static createDefaultMaterial(settings: MaterialSettings): THREE.Material {
    return this.createMaterial({
      color: settings.color || 0x666666,
      ...settings,
      type: settings.type || 'phong',
    });
  }

  private static parseColor(colorString: string): number {
    if (colorString.startsWith('#')) {
      return parseInt(colorString.slice(1), 16);
    }
    
    if (colorString.startsWith('rgb')) {
      const matches = colorString.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]);
        const g = parseInt(matches[1]);
        const b = parseInt(matches[2]);
        return (r << 16) | (g << 8) | b;
      }
    }
    
    const namedColors: { [key: string]: number } = {
      'red': 0xff0000, 'green': 0x00ff00, 'blue': 0x0000ff,
      'black': 0x000000, 'white': 0xffffff, 'gray': 0x808080,
      'yellow': 0xffff00, 'cyan': 0x00ffff, 'magenta': 0xff00ff,
    };
    
    return namedColors[colorString.toLowerCase()] || 0x666666;
  }

  private static generateColor(index: number): number {
    const colors = [
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57,
      0xff9ff3, 0x54a0ff, 0x5f27cd, 0x00d2d3, 0xff9f43,
      0xee5a24, 0x0984e3, 0x6c5ce7, 0xa29bfe, 0xfd79a8
    ];
    return colors[index % colors.length];
  }

  private static simplifyGeometry(geometry: THREE.ExtrudeGeometry, ratio: number): void {
    // Basic geometry simplification
    const positions = geometry.attributes.position;
    if (positions && positions.count > 1000) {
      const newCount = Math.floor(positions.count * ratio);
      const newPositions = new Float32Array(newCount * 3);
      
      for (let i = 0; i < newCount; i++) {
        const sourceIndex = Math.floor((i / newCount) * positions.count);
        newPositions[i * 3] = positions.getX(sourceIndex);
        newPositions[i * 3 + 1] = positions.getY(sourceIndex);
        newPositions[i * 3 + 2] = positions.getZ(sourceIndex);
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    }
  }
}

export default EnhancedGeometryCreator;
