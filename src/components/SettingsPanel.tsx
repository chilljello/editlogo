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
    <>
      {/* Backdrop */}
      <div className="settings-backdrop active" onClick={onClose} />
      
      {/* Settings Panel */}
      <div className="settings-panel open">
        <div className="panel-header">
          <h2 className="panel-title">Settings</h2>
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="panel-content">
          {/* Extrude Settings */}
          <div className="settings-section">
            <h3 className="section-title">Extrude Settings</h3>
            
            <div className="setting-group">
              <label className="setting-label">
                Depth: {extrudeSettings.depth}
                <span className="value-display">{extrudeSettings.depth}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={extrudeSettings.depth}
                onChange={(e) => updateExtrudeSetting('depth', Number(e.target.value))}
                className="range-slider"
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="bevelEnabled"
                checked={extrudeSettings.bevelEnabled}
                onChange={(e) => updateExtrudeSetting('bevelEnabled', e.target.checked)}
                className="checkbox"
              />
              <label htmlFor="bevelEnabled" className="checkbox-label">
                Enable Bevel
              </label>
            </div>

            {extrudeSettings.bevelEnabled && (
              <>
                <div className="setting-group">
                  <label className="setting-label">
                    Bevel Thickness: {extrudeSettings.bevelThickness}
                    <span className="value-display">{extrudeSettings.bevelThickness}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={extrudeSettings.bevelThickness}
                    onChange={(e) => updateExtrudeSetting('bevelThickness', Number(e.target.value))}
                    className="range-slider"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    Bevel Size: {extrudeSettings.bevelSize}
                    <span className="value-display">{extrudeSettings.bevelSize}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={extrudeSettings.bevelSize}
                    onChange={(e) => updateExtrudeSetting('bevelSize', Number(e.target.value))}
                    className="range-slider"
                  />
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    Bevel Segments: {extrudeSettings.bevelSegments}
                    <span className="value-display">{extrudeSettings.bevelSegments}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={extrudeSettings.bevelSegments}
                    onChange={(e) => updateExtrudeSetting('bevelSegments', Number(e.target.value))}
                    className="range-slider"
                  />
                </div>
              </>
            )}
          </div>

          {/* Material Settings */}
          <div className="settings-section">
            <h3 className="section-title">Material Settings</h3>
            
            <div className="setting-group">
              <label className="setting-label">Color</label>
              <input
                type="color"
                value={materialSettings.color}
                onChange={(e) => updateMaterialSetting('color', e.target.value)}
                className="color-picker"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Metalness: {materialSettings.metalness.toFixed(2)}
                <span className="value-display">{materialSettings.metalness.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={materialSettings.metalness}
                onChange={(e) => updateMaterialSetting('metalness', Number(e.target.value))}
                className="range-slider"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Roughness: {materialSettings.roughness.toFixed(2)}
                <span className="value-display">{materialSettings.roughness.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={materialSettings.roughness}
                onChange={(e) => updateMaterialSetting('roughness', Number(e.target.value))}
                className="range-slider"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">Emissive Color</label>
              <input
                type="color"
                value={materialSettings.emissive}
                onChange={(e) => updateMaterialSetting('emissive', e.target.value)}
                className="color-picker"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Emissive Intensity: {materialSettings.emissiveIntensity.toFixed(2)}
                <span className="value-display">{materialSettings.emissiveIntensity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={materialSettings.emissiveIntensity}
                onChange={(e) => updateMaterialSetting('emissiveIntensity', Number(e.target.value))}
                className="range-slider"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;