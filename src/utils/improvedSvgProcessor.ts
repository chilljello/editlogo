import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

// Simplified and improved interfaces
export interface SVGProcessingOptions {
  depth?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelOffset?: number;
  bevelSegments?: number;
  curveSegments?: number;
  steps?: number;
  scale?: number;
  centerGeometry?: boolean;
  autoRotate?: boolean;
}

export interface ProcessedSVGData {
  geometry: THREE.ExtrudeGeometry;
  materials: THREE.Material[];
  metadata: {
    viewBox: { x: number; y: number; width: number; height: number };
    pathCount: number;
    totalVertices: number;
    boundingBox: THREE.Box3;
  };
  originalShapes: THREE.Shape[];
}

export interface ProcessedSVGResult {
  success: boolean;
  data?: ProcessedSVGData;
  error?: string;
}

// Default processing options with higher segment counts for better detail
const DEFAULT_OPTIONS: Required<SVGProcessingOptions> = {
  depth: 100,
  bevelEnabled: true,
  bevelThickness: 2,
  bevelSize: 1,
  bevelOffset: 0,
  bevelSegments: 8, // Increased from 3 to 8 for smoother bevels
  curveSegments: 128, // Increased from 32 to 128 for smoother curves
  steps: 4, // Increased from 2 to 4 for more depth steps
  scale: 1,
  centerGeometry: true,
  autoRotate: true,
};

// Enhanced SVG processor with better error handling and performance
export class ImprovedSVGProcessor {
  private options: Required<SVGProcessingOptions>;

  constructor(options: SVGProcessingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Process SVG file and convert to 3D geometry
   */
  async processSVGFile(file: File): Promise<ProcessedSVGResult> {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        return { success: false, error: 'Invalid file type. Please provide an SVG file.' };
      }

      // Read file content
      const svgContent = await this.readFileContent(file);
      if (!svgContent) {
        return { success: false, error: 'Failed to read file content' };
      }

      // Parse SVG using Three.js loader
      const svgData = this.parseSVGContent(svgContent);
      if (!svgData) {
        return { success: false, error: 'Failed to parse SVG content' };
      }

      // Extract shapes and create geometry
      const result = this.createGeometryFromSVG(svgData);
      return { success: true, data: result };

    } catch (error) {
      console.error('SVG processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Process SVG from URL
   */
  async processSVGFromURL(url: string): Promise<ProcessedSVGResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch SVG: ${response.statusText}`);
      }
      
      const svgContent = await response.text();
      const svgData = this.parseSVGContent(svgContent);
      
      if (!svgData) {
        return { success: false, error: 'Failed to parse SVG content' };
      }

      const result = this.createGeometryFromSVG(svgData);
      return { success: true, data: result };

    } catch (error) {
      console.error('SVG URL processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process SVG from URL' 
      };
    }
  }

  /**
   * Update processing options
   */
  updateOptions(newOptions: Partial<SVGProcessingOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  private validateFile(file: File): boolean {
    return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseSVGContent(content: string): any {
    try {
      const loader = new SVGLoader();
      return loader.parse(content);
    } catch (error) {
      console.error('SVG parsing error:', error);
      return null;
    }
  }

  private createGeometryFromSVG(svgData: any): ProcessedSVGData {
    // Extract shapes using Three.js built-in method with high resolution
    const shapes = svgData.paths.flatMap((path: any) => {
      // Convert path to shapes with high curve resolution
      const pathShapes = path.toShapes(true);
      
      // Enhance each shape with more curve segments
      return pathShapes.map(shape => this.enhanceShapeSegments(shape));
    });
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found in SVG');
    }

    // Create enhanced extrude settings with more segments
    const extrudeSettings = {
      depth: this.options.depth,
      bevelEnabled: this.options.bevelEnabled,
      bevelThickness: this.options.bevelThickness,
      bevelSize: this.options.bevelSize,
      bevelOffset: this.options.bevelOffset,
      bevelSegments: this.options.bevelSegments,
      curveSegments: this.options.curveSegments,
      steps: this.options.steps,
      // Additional settings for higher quality
      bevelThicknessCurveTension: 0.5,
      bevelSizeCurveTension: 0.5,
    };

    // Create geometry with enhanced settings
    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
    
    // Apply additional optimizations for high segment count
    this.optimizeHighSegmentGeometry(geometry);
    
    // Apply transformations
    this.applyTransformations(geometry);
    
    // Create materials based on SVG paths
    const materials = this.createMaterials(svgData.paths);
    
    // Extract metadata
    const metadata = this.extractMetadata(svgData, geometry);

    return {
      geometry,
      materials,
      metadata,
      originalShapes: shapes,
    };
  }

  private applyTransformations(geometry: THREE.ExtrudeGeometry): void {
    // Center geometry if requested
    if (this.options.centerGeometry) {
      geometry.computeBoundingBox();
      const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
      geometry.translate(-center.x, -center.y, -center.z);
    }

    // Auto-rotate if requested (fix orientation for better viewing)
    if (this.options.autoRotate) {
      geometry.rotateX(Math.PI);
    }

    // Apply scale
    if (this.options.scale !== 1) {
      geometry.scale(this.options.scale, this.options.scale, this.options.scale);
    }
  }

  private createMaterials(paths: any[]): THREE.Material[] {
    const materials: THREE.Material[] = [];
    
    for (const path of paths) {
      const color = this.extractColorFromPath(path);
      const material = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30,
        specular: 0x111111,
      });
      materials.push(material);
    }
    
    // If no materials created, add a default one
    if (materials.length === 0) {
      materials.push(new THREE.MeshPhongMaterial({ color: 0x666666 }));
    }
    
    return materials;
  }

  private extractColorFromPath(path: any): number {
    // Try to extract color from path attributes
    if (path.userData?.node) {
      const node = path.userData.node;
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      
      if (fill && fill !== 'none') {
        return this.parseColor(fill);
      }
      if (stroke && stroke !== 'none') {
        return this.parseColor(stroke);
      }
    }
    
    // Default color
    return 0x666666;
  }

  private parseColor(colorString: string): number {
    // Simple color parsing - can be enhanced
    if (colorString.startsWith('#')) {
      return parseInt(colorString.slice(1), 16);
    }
    if (colorString.startsWith('rgb')) {
      // Basic RGB parsing
      const matches = colorString.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]);
        const g = parseInt(matches[1]);
        const b = parseInt(matches[2]);
        return (r << 16) | (g << 8) | b;
      }
    }
    
    // Named colors (basic support)
    const namedColors: { [key: string]: number } = {
      'red': 0xff0000,
      'green': 0x00ff00,
      'blue': 0x0000ff,
      'black': 0x000000,
      'white': 0xffffff,
      'gray': 0x808080,
    };
    
    return namedColors[colorString.toLowerCase()] || 0x666666;
  }

  private extractMetadata(svgData: any, geometry: THREE.ExtrudeGeometry): ProcessedSVGData['metadata'] {
    const viewBox = svgData.xml?.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 200, 200];
    
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox!;
    
    return {
      viewBox: {
        x: viewBox[0],
        y: viewBox[1],
        width: viewBox[2],
        height: viewBox[3],
      },
      pathCount: svgData.paths?.length || 0,
      totalVertices: geometry.attributes.position.count,
      boundingBox: boundingBox,
    };
  }

  /**
   * Enhance shape with more curve segments for smoother geometry
   */
  private enhanceShapeSegments(shape: THREE.Shape): THREE.Shape {
    // Get high-resolution points from the shape
    const points = shape.getPoints(this.options.curveSegments);
    
    // Create a new shape with enhanced curve resolution
    const enhancedShape = new THREE.Shape();
    
    if (points.length > 0) {
      enhancedShape.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        enhancedShape.lineTo(points[i].x, points[i].y);
      }
      
      // Close the shape if it's not already closed
      if (!shape.autoClose) {
        enhancedShape.closePath();
      }
    }
    
    return enhancedShape;
  }

  /**
   * Optimize geometry for high segment count
   */
  private optimizeHighSegmentGeometry(geometry: THREE.ExtrudeGeometry): void {
    // Compute normals for better lighting
    geometry.computeVertexNormals();
    
    // Optimize for high vertex count
    if (geometry.attributes.position.count > 10000) {
      // Merge vertices to reduce redundancy
      geometry.mergeVertices();
      
      // Recompute normals after merging
      geometry.computeVertexNormals();
    }
    
    // Compute tangents for better material rendering
    geometry.computeTangents();
    
    // Optimize bounding box and sphere for better culling
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
}

// Convenience function for quick SVG processing
export const processSVG = async (
  input: File | string, 
  options: SVGProcessingOptions = {}
): Promise<ProcessedSVGResult> => {
  const processor = new ImprovedSVGProcessor(options);
  
  if (typeof input === 'string') {
    return processor.processSVGFromURL(input);
  } else {
    return processor.processSVGFile(input);
  }
};

// Note: React hooks are moved to the component file to avoid React dependency in utils
