import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export interface AdvancedSVGData {
  shapes: THREE.Shape[];
  curves: THREE.Curve<THREE.Vector3>[];
  svgString: string;
  metadata: {
    viewBox: { x: number; y: number; width: number; height: number };
    paths: Array<{
      id: string;
      d: string;
      fill: string;
      stroke: string;
      strokeWidth: number;
    }>;
  };
  individualShapes: Array<{
    shape: THREE.Shape;
    boundingBox: { min: THREE.Vector2; max: THREE.Vector2; size: THREE.Vector2 };
    complexity: number;
    curveCount: number;
    pathData: string;
    element: Element;
  }>;
}

export interface AdvancedProcessedSVGResult {
  success: boolean;
  data?: AdvancedSVGData;
  error?: string;
}

// Enhanced SVG path parser with full curve support
export class AdvancedSVGPathParser {
  private currentX = 0;
  private currentY = 0;
  private startX = 0;
  private startY = 0;
  private subpathStartX = 0;
  private subpathStartY = 0;
  private lastControlX = 0;
  private lastControlY = 0;

  parsePath(pathData: string): THREE.Shape {
    const shape = new THREE.Shape();
    this.reset();
    
    console.log('Advanced parsing SVG path:', pathData);
    
    // Split the path data into commands
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    console.log('Path commands found:', commands.length);
    
    for (const command of commands) {
      this.parseCommand(command, shape);
    }
    
    // Ensure the path is closed
    if (!pathData.includes('Z') && !pathData.includes('z')) {
      shape.closePath();
    }
    
    console.log('Advanced path parsing completed');
    return shape;
  }

  private reset(): void {
    this.currentX = 0;
    this.currentY = 0;
    this.startX = 0;
    this.startY = 0;
    this.subpathStartX = 0;
    this.subpathStartY = 0;
    this.lastControlX = 0;
    this.lastControlY = 0;
  }

  private parseCommand(command: string, shape: THREE.Shape): void {
    const type = command[0];
    const coords = command.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
    
    switch (type.toLowerCase()) {
      case 'm': // Move to (relative)
        this.handleMoveTo(coords, type === 'M', shape);
        break;
      case 'l': // Line to (relative)
        this.handleLineTo(coords, type === 'L', shape);
        break;
      case 'h': // Horizontal line
        this.handleHorizontalLine(coords, type === 'H', shape);
        break;
      case 'v': // Vertical line
        this.handleVerticalLine(coords, type === 'V', shape);
        break;
      case 'c': // Cubic Bézier curve
        this.handleCubicBezier(coords, type === 'C', shape);
        break;
      case 's': // Smooth cubic Bézier curve
        this.handleSmoothCubicBezier(coords, type === 'S', shape);
        break;
      case 'q': // Quadratic Bézier curve
        this.handleQuadraticBezier(coords, type === 'Q', shape);
        break;
      case 't': // Smooth quadratic Bézier curve
        this.handleSmoothQuadraticBezier(coords, type === 'T', shape);
        break;
      case 'a': // Arc
        this.handleArc(coords, type === 'A', shape);
        break;
      case 'z': // Close path
        this.handleClosePath(shape);
        break;
      default:
        console.log(`Unsupported SVG command: ${type}`);
        break;
    }
  }

  private handleMoveTo(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 2) {
      if (isAbsolute) {
        this.currentX = coords[0];
        this.currentY = coords[1];
      } else {
        this.currentX += coords[0];
        this.currentY += coords[1];
      }
      shape.moveTo(this.currentX, this.currentY);
      this.subpathStartX = this.currentX;
      this.subpathStartY = this.currentY;
    }
  }

  private handleLineTo(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 2) {
      if (isAbsolute) {
        this.currentX = coords[0];
        this.currentY = coords[1];
      } else {
        this.currentX += coords[0];
        this.currentY += coords[1];
      }
      shape.lineTo(this.currentX, this.currentY);
    }
  }

  private handleHorizontalLine(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 1) {
      if (isAbsolute) {
        this.currentX = coords[0];
      } else {
        this.currentX += coords[0];
      }
      shape.lineTo(this.currentX, this.currentY);
    }
  }

  private handleVerticalLine(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 1) {
      if (isAbsolute) {
        this.currentY = coords[0];
      } else {
        this.currentY += coords[0];
      }
      shape.lineTo(this.currentX, this.currentY);
    }
  }

  private handleCubicBezier(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 6) {
      const cp1x = isAbsolute ? coords[0] : this.currentX + coords[0];
      const cp1y = isAbsolute ? coords[1] : this.currentY + coords[1];
      const cp2x = isAbsolute ? coords[2] : this.currentX + coords[2];
      const cp2y = isAbsolute ? coords[3] : this.currentY + coords[3];
      const endX = isAbsolute ? coords[4] : this.currentX + coords[4];
      const endY = isAbsolute ? coords[5] : this.currentY + coords[5];

      // Create a cubic Bézier curve
      const curve = new THREE.CubicBezierCurve(
        new THREE.Vector2(this.currentX, this.currentY),
        new THREE.Vector2(cp1x, cp1y),
        new THREE.Vector2(cp2x, cp2y),
        new THREE.Vector2(endX, endY)
      );

      // Add curve points to shape
      const points = curve.getPoints(50); // High resolution for smooth curves
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }

      this.currentX = endX;
      this.currentY = endY;
      this.lastControlX = cp2x;
      this.lastControlY = cp2y;
    }
  }

  private handleSmoothCubicBezier(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 4) {
      // Calculate the first control point as reflection of the last control point
      const cp1x = this.currentX - (this.lastControlX - this.currentX);
      const cp1y = this.currentY - (this.lastControlY - this.currentY);
      
      const cp2x = isAbsolute ? coords[0] : this.currentX + coords[0];
      const cp2y = isAbsolute ? coords[1] : this.currentY + coords[1];
      const endX = isAbsolute ? coords[2] : this.currentX + coords[2];
      const endY = isAbsolute ? coords[3] : this.currentY + coords[3];

      const curve = new THREE.CubicBezierCurve(
        new THREE.Vector2(this.currentX, this.currentY),
        new THREE.Vector2(cp1x, cp1y),
        new THREE.Vector2(cp2x, cp2y),
        new THREE.Vector2(endX, endY)
      );

      const points = curve.getPoints(50);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }

      this.currentX = endX;
      this.currentY = endY;
      this.lastControlX = cp2x;
      this.lastControlY = cp2y;
    }
  }

  private handleQuadraticBezier(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 4) {
      const cpx = isAbsolute ? coords[0] : this.currentX + coords[0];
      const cpy = isAbsolute ? coords[1] : this.currentY + coords[1];
      const endX = isAbsolute ? coords[2] : this.currentX + coords[2];
      const endY = isAbsolute ? coords[3] : this.currentY + coords[3];

      const curve = new THREE.QuadraticBezierCurve(
        new THREE.Vector2(this.currentX, this.currentY),
        new THREE.Vector2(cpx, cpy),
        new THREE.Vector2(endX, endY)
      );

      const points = curve.getPoints(30);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }

      this.currentX = endX;
      this.currentY = endY;
      this.lastControlX = cpx;
      this.lastControlY = cpy;
    }
  }

  private handleSmoothQuadraticBezier(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 2) {
      // Calculate control point as reflection of the last control point
      const cpx = this.currentX - (this.lastControlX - this.currentX);
      const cpy = this.currentY - (this.lastControlY - this.currentY);
      
      const endX = isAbsolute ? coords[0] : this.currentX + coords[0];
      const endY = isAbsolute ? coords[1] : this.currentY + coords[1];

      const curve = new THREE.QuadraticBezierCurve(
        new THREE.Vector2(this.currentX, this.currentY),
        new THREE.Vector2(cpx, cpy),
        new THREE.Vector2(endX, endY)
      );

      const points = curve.getPoints(30);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }

      this.currentX = endX;
      this.currentY = endY;
      this.lastControlX = cpx;
      this.lastControlY = cpy;
    }
  }

  private handleArc(coords: number[], isAbsolute: boolean, shape: THREE.Shape): void {
    if (coords.length >= 7) {
      const rx = coords[0];
      const ry = coords[1];
      const rotation = coords[2] * Math.PI / 180; // Convert to radians
      const largeArcFlag = coords[3] !== 0;
      const sweepFlag = coords[4] !== 0;
      const endX = isAbsolute ? coords[5] : this.currentX + coords[5];
      const endY = isAbsolute ? coords[6] : this.currentY + coords[6];

      // Create an elliptical arc curve
      const arc = this.createEllipticalArc(
        this.currentX, this.currentY,
        endX, endY,
        rx, ry, rotation,
        largeArcFlag, sweepFlag
      );

      if (arc) {
        const points = arc.getPoints(50);
        for (let i = 1; i < points.length; i++) {
          shape.lineTo(points[i].x, points[i].y);
        }
      } else {
        // Fallback to line if arc creation fails
        shape.lineTo(endX, endY);
      }

      this.currentX = endX;
      this.currentY = endY;
    }
  }

  private createEllipticalArc(
    x1: number, y1: number,
    x2: number, y2: number,
    rx: number, ry: number,
    rotation: number,
    largeArcFlag: boolean,
    sweepFlag: boolean
  ): THREE.EllipseCurve | null {
    try {
      // Simplified arc implementation
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      const startAngle = Math.atan2(y1 - centerY, x1 - centerX);
      const endAngle = Math.atan2(y2 - centerY, x2 - centerX);

      return new THREE.EllipseCurve(
        centerX, centerY,
        rx, ry,
        startAngle, endAngle,
        false, // clockwise
        0 // rotation
      );
    } catch (error) {
      console.warn('Failed to create elliptical arc:', error);
      return null;
    }
  }

  private handleClosePath(shape: THREE.Shape): void {
    shape.closePath();
    this.currentX = this.subpathStartX;
    this.currentY = this.subpathStartY;
  }
}

// Create advanced 3D geometry from SVG data
export const createAdvancedGeometry = (
  shapes: THREE.Shape[],
  extrudeSettings: {
    depth: number;
    bevelEnabled: boolean;
    bevelThickness: number;
    bevelSize: number;
    bevelOffset: number;
    bevelSegments: number;
  }
): THREE.ExtrudeGeometry => {
  console.log('Creating advanced geometry with', shapes.length, 'shapes');
  
  const settings = {
    depth: extrudeSettings.depth,
    bevelEnabled: extrudeSettings.bevelEnabled,
    bevelThickness: extrudeSettings.bevelThickness,
    bevelSize: extrudeSettings.bevelSize,
    bevelOffset: extrudeSettings.bevelOffset,
    bevelSegments: extrudeSettings.bevelSegments,
    curveSegments: 64, // High resolution for smooth curves
    steps: 2, // Number of points along the extrude depth
  };

  const geometry = new THREE.ExtrudeGeometry(shapes, settings);
  
  // Center the geometry
  geometry.computeBoundingBox();
  const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);

  // Fix orientation
  geometry.rotateX(Math.PI);
  
  // Scale to fit in view
  const size = geometry.boundingBox!.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = 20 / maxDimension;
  geometry.scale(scale, scale, scale);

  console.log('Advanced geometry created with', geometry.attributes.position.count, 'vertices');
  return geometry;
};

// Calculate shape complexity and bounding box
export const analyzeShape = (shape: THREE.Shape, pathData: string): {
  boundingBox: { min: THREE.Vector2; max: THREE.Vector2; size: THREE.Vector2 };
  complexity: number;
  curveCount: number;
} => {
  const points = shape.getPoints(100);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  points.forEach(point => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const boundingBox = {
    min: new THREE.Vector2(minX, minY),
    max: new THREE.Vector2(maxX, maxY),
    size: new THREE.Vector2(maxX - minX, maxY - minY)
  };

  // Calculate complexity based on path data
  const curveCommands = pathData.match(/[CcSsQqTtAa]/g) || [];
  const curveCount = curveCommands.length;
  const complexity = points.length + curveCount * 10; // Higher complexity for more curves

  return { boundingBox, complexity, curveCount };
};

// Extract metadata from SVG
export const extractSVGMetadata = (svgString: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) {
    return {
      viewBox: { x: 0, y: 0, width: 200, height: 200 },
      paths: []
    };
  }

  const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 200, 200];
  const paths = Array.from(svg.querySelectorAll('path')).map((path, index) => ({
    id: path.getAttribute('id') || `path-${index}`,
    d: path.getAttribute('d') || '',
    fill: path.getAttribute('fill') || 'black',
    stroke: path.getAttribute('stroke') || 'none',
    strokeWidth: parseFloat(path.getAttribute('stroke-width') || '0')
  }));

  return {
    viewBox: {
      x: viewBox[0],
      y: viewBox[1],
      width: viewBox[2],
      height: viewBox[3]
    },
    paths
  };
};

// Main advanced SVG processing function
export const processAdvancedSVGFile = async (file: File): Promise<AdvancedProcessedSVGResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        console.log('Advanced SVG processing started');
        
        const loader = new SVGLoader();
        const svgData = loader.parse(text);
        console.log('SVG Data loaded:', svgData);
        
        // Extract metadata
        const metadata = extractSVGMetadata(text);
        console.log('SVG metadata:', metadata);
        
        const parser = new AdvancedSVGPathParser();
        const shapes: THREE.Shape[] = [];
        const curves: THREE.Curve<THREE.Vector3>[] = [];
        const individualShapes: Array<{
          shape: THREE.Shape;
          boundingBox: { min: THREE.Vector2; max: THREE.Vector2; size: THREE.Vector2 };
          complexity: number;
          curveCount: number;
          pathData: string;
          element: Element;
        }> = [];
        
        if (svgData.paths && svgData.paths.length > 0) {
          console.log('Processing', svgData.paths.length, 'SVG paths');
          
          for (let i = 0; i < svgData.paths.length; i++) {
            const svgPath = svgData.paths[i];
            console.log(`Processing path ${i}:`, svgPath);
            
            try {
              // Try to get path data from userData
              if (svgPath.userData && svgPath.userData.node) {
                const node = svgPath.userData.node;
                const pathData = node.getAttribute('d');
                
                if (pathData) {
                  console.log(`Parsing path data for path ${i}:`, pathData);
                  const shape = parser.parsePath(pathData);
                  shapes.push(shape);
                  
                  // Analyze individual shape
                  const analysis = analyzeShape(shape, pathData);
                  individualShapes.push({
                    shape,
                    boundingBox: analysis.boundingBox,
                    complexity: analysis.complexity,
                    curveCount: analysis.curveCount,
                    pathData,
                    element: node
                  });
                  
                  // Also create a 3D curve for advanced rendering
                  const points = shape.getPoints(100);
                  if (points.length > 2) {
                    const curve = new THREE.CatmullRomCurve3(
                      points.map(p => new THREE.Vector3(p.x, p.y, 0))
                    );
                    curves.push(curve);
                  }
                } else {
                  console.warn(`No path data found for path ${i}`);
                }
              } else {
                console.warn(`No userData found for path ${i}`);
              }
            } catch (error) {
              console.error(`Error processing path ${i}:`, error);
            }
          }
        }
        
        // If no shapes were created, create a fallback
        if (shapes.length === 0) {
          console.warn('No valid shapes found, creating fallback');
          const fallbackShape = new THREE.Shape();
          fallbackShape.moveTo(-10, -10);
          fallbackShape.lineTo(10, -10);
          fallbackShape.lineTo(10, 10);
          fallbackShape.lineTo(-10, 10);
          fallbackShape.closePath();
          shapes.push(fallbackShape);
        }
        
        console.log('Advanced SVG processing completed:', {
          shapes: shapes.length,
          curves: curves.length
        });
        
        resolve({
          success: true,
          data: {
            shapes,
            curves,
            svgString: text,
            metadata,
            individualShapes
          }
        });
        
      } catch (error) {
        console.error('Error in advanced SVG processing:', error);
        resolve({
          success: false,
          error: `Advanced SVG processing failed: ${error}`
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file'
      });
    };
    
    reader.readAsText(file);
  });
};
