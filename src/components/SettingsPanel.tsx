import React from 'react';
import { X } from 'lucide-react';

interface SettingsPanelProps {
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
  onExtrudeSettingsChange: (settings: any) => void;
  onMaterialSettingsChange: (settings: any) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  extrudeSettings,
  materialSettings,
  onExtrudeSettingsChange,
  onMaterialSettingsChange,
  onClose,
}) => {
  const updateExtrudeSetting = (key: string, value: any) => {
    onExtrudeSettingsChange({ ...extrudeSettings, [key]: value });
  };

  const updateMaterialSetting = (key: string, value: any) => {
    onMaterialSettingsChange({ ...materialSettings, [key]: value });
  };

  return (
    <div className="w-80 bg-white/10 backdrop-blur-md border-l border-white/20 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Extrude Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Extrude Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Depth: {extrudeSettings.depth}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={extrudeSettings.depth}
              onChange={(e) => updateExtrudeSetting('depth', Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="bevelEnabled"
              checked={extrudeSettings.bevelEnabled}
              onChange={(e) => updateExtrudeSetting('bevelEnabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
            />
            <label htmlFor="bevelEnabled" className="text-sm font-medium text-white/80">
              Enable Bevel
            </label>
          </div>

          {extrudeSettings.bevelEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Bevel Thickness: {extrudeSettings.bevelThickness}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={extrudeSettings.bevelThickness}
                  onChange={(e) => updateExtrudeSetting('bevelThickness', Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Bevel Size: {extrudeSettings.bevelSize}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={extrudeSettings.bevelSize}
                  onChange={(e) => updateExtrudeSetting('bevelSize', Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Bevel Segments: {extrudeSettings.bevelSegments}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={extrudeSettings.bevelSegments}
                  onChange={(e) => updateExtrudeSetting('bevelSegments', Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Material Settings */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Material Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Color
            </label>
            <input
              type="color"
              value={materialSettings.color}
              onChange={(e) => updateMaterialSetting('color', e.target.value)}
              className="w-full h-10 rounded-lg border-0 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Metalness: {materialSettings.metalness.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={materialSettings.metalness}
              onChange={(e) => updateMaterialSetting('metalness', Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Roughness: {materialSettings.roughness.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={materialSettings.roughness}
              onChange={(e) => updateMaterialSetting('roughness', Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Emissive Color
            </label>
            <input
              type="color"
              value={materialSettings.emissive}
              onChange={(e) => updateMaterialSetting('emissive', e.target.value)}
              className="w-full h-10 rounded-lg border-0 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Emissive Intensity: {materialSettings.emissiveIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={materialSettings.emissiveIntensity}
              onChange={(e) => updateMaterialSetting('emissiveIntensity', Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
