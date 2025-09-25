import React, { useState } from 'react';
import { X, Copy, Download } from 'lucide-react';

interface ExportModalProps {
  svgData: {
    paths: THREE.Path[];
    svgString: string;
  };
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
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  svgData,
  extrudeSettings,
  materialSettings,
  onClose,
}) => {
  const [exportType, setExportType] = useState<'react' | 'three'>('react');
  const [includeControls, setIncludeControls] = useState(true);
  const [includeLights, setIncludeLights] = useState(true);
  const [includeShadows, setIncludeShadows] = useState(true);

  const generateReactComponent = () => {
    const componentName = 'ExtrudedSVGComponent';
    
    const extrudeSettingsCode = JSON.stringify(extrudeSettings, null, 2);
    const materialSettingsCode = JSON.stringify(materialSettings, null, 2);
    
    // Convert SVG paths to a more usable format
    const pathsCode = svgData.paths.map((path, index) => {
      const points = path.getPoints();
      return `    const path${index} = new THREE.Path();
${points.map((point, pointIndex) => 
      `    path${index}.lineTo(${point.x}, ${point.y});`
    ).join('\n')}`;
    }).join('\n\n');

    const reactComponent = `import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const ${componentName}: React.FC = () => {
  const { geometry, material } = useMemo(() => {
    // SVG Paths
${pathsCode}

    const paths = [${svgData.paths.map((_, index) => `path${index}`).join(', ')}];
    
    // Convert paths to shapes
    const shapes = paths.map(path => {
      const points = path.getPoints();
      const shape = new THREE.Shape();
      
      if (points.length > 0) {
        shape.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          shape.lineTo(points[i].x, points[i].y);
        }
        shape.closePath();
      }
      
      return shape;
    });

    // Extrude settings
    const extrudeSettings = ${extrudeSettingsCode};

    // Create geometry
    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
    
    // Center the geometry
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);

    // Scale to fit in view
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 20 / maxDimension;
    geometry.scale(scale, scale, scale);

    // Create material
    const material = new THREE.MeshStandardMaterial(${materialSettingsCode});

    return { geometry, material };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 50], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        ${includeLights ? `<Environment preset="studio" />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />` : ''}
        
        <mesh geometry={geometry} material={material} castShadow receiveShadow />
        
        ${includeShadows ? `<ContactShadows
          position={[0, -10, 0]}
          opacity={0.4}
          scale={200}
          blur={1.5}
          far={4.5}
          resolution={256}
          color="#000000"
        />` : ''}
        
        ${includeControls ? '<OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />' : ''}
      </Canvas>
    </div>
  );
};

export default ${componentName};`;

    return reactComponent;
  };

  const generateThreeJSComponent = () => {
    const threeComponent = `import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class ExtrudedSVG {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private mesh: THREE.Mesh;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 0, 50);
    
    this.setupLights();
    this.createGeometry();
    this.animate();
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, -10, -10);
    this.scene.add(pointLight);
  }

  private createGeometry() {
    // SVG Paths would be converted here
    // This is a simplified example
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshStandardMaterial({
      color: ${materialSettings.color},
      metalness: ${materialSettings.metalness},
      roughness: ${materialSettings.roughness},
      emissive: ${materialSettings.emissive},
      emissiveIntensity: ${materialSettings.emissiveIntensity}
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.renderer.dispose();
    this.controls.dispose();
  }
}

export default ExtrudedSVG;`;

    return threeComponent;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatedCode = exportType === 'react' ? generateReactComponent() : generateThreeJSComponent();
  const filename = exportType === 'react' ? 'ExtrudedSVGComponent.tsx' : 'ExtrudedSVG.ts';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Export Component</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex">
          {/* Settings Panel */}
          <div className="w-80 p-6 border-r bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Export Options</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Type
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as 'react' | 'three')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="react">React Component</option>
                  <option value="three">Three.js Class</option>
                </select>
              </div>

              {exportType === 'react' && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeControls"
                      checked={includeControls}
                      onChange={(e) => setIncludeControls(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeControls" className="text-sm font-medium text-gray-700">
                      Include OrbitControls
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeLights"
                      checked={includeLights}
                      onChange={(e) => setIncludeLights(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeLights" className="text-sm font-medium text-gray-700">
                      Include Lighting
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeShadows"
                      checked={includeShadows}
                      onChange={(e) => setIncludeShadows(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeShadows" className="text-sm font-medium text-gray-700">
                      Include Shadows
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Code Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generated Code</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedCode)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => downloadFile(generatedCode, filename)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
