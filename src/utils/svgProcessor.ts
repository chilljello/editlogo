import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export interface SVGData {
  paths: any[];
  svgString: string;
}

export interface ProcessedSVGResult {
  success: boolean;
  data?: SVGData;
  error?: string;
}

// Simple SVG path parser
export const parseSVGPath = (pathData: string, path: THREE.Path): void => {
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

// Create fallback geometry
export const createFallbackGeometry = (): THREE.Path => {
  const fallbackPath = new THREE.Path();
  fallbackPath.moveTo(-10, -10);
  fallbackPath.lineTo(10, -10);
  fallbackPath.lineTo(10, 10);
  fallbackPath.lineTo(-10, 10);
  fallbackPath.closePath();
  return fallbackPath;
};

// Process SVG paths
export const processSVGPaths = (svgData: any): THREE.Path[] => {
  console.log('SVG paths found, processing...');
  
  return svgData.paths.map((svgPath: any, index: number) => {
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
          return createFallbackGeometry();
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
      return createFallbackGeometry();
    }
  });
};

// Main SVG processing function
export const processSVGFile = async (file: File): Promise<ProcessedSVGResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        console.log('SVG file content:', text.substring(0, 200) + '...');
        
        const loader = new SVGLoader();
        const svgData = loader.parse(text);
        console.log('SVG Data structure:', svgData);
        console.log('Paths found:', svgData.paths?.length || 0);
        console.log('First path:', svgData.paths?.[0]);
        
        if (!svgData.paths || svgData.paths.length === 0) {
          console.warn('No paths found in SVG, creating fallback geometry');
          const fallbackPath = createFallbackGeometry();
          
          resolve({
            success: true,
            data: {
              paths: [fallbackPath],
              svgString: text
            }
          });
        } else {
          const threePaths = processSVGPaths(svgData);
          console.log('Converted paths:', threePaths);
          
          resolve({
            success: true,
            data: {
              paths: threePaths,
              svgString: text
            }
          });
        }
      } catch (error) {
        console.error('Error parsing SVG:', error);
        console.log('Creating fallback geometry due to parsing error');
        
        // Create fallback geometry
        const fallbackPath = createFallbackGeometry();
        
        resolve({
          success: true,
          data: {
            paths: [fallbackPath],
            svgString: (e.target?.result as string) || ''
          }
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
