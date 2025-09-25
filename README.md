# 3D SVG Extruder

A powerful web application built with Bun, TypeScript, React, and Three.js that allows users to drag and drop SVG files and convert them into beautiful 3D extruded models with advanced material properties and lighting.

## Features

- 🎨 **Drag & Drop Interface**: Intuitive SVG file upload with drag-and-drop support
- 🎯 **3D Extrusion**: Convert 2D SVG paths into 3D extruded models
- 🎨 **Advanced Materials**: PBR materials with metalness, roughness, and emissive properties
- ⚙️ **Real-time Settings**: Adjust extrusion depth, bevel settings, and material properties
- 💡 **Professional Lighting**: Studio-quality lighting with shadows and environment mapping
- 📤 **Export Options**: Generate React components or Three.js classes
- 🎮 **Interactive Controls**: Orbit controls for 3D navigation
- 📱 **Responsive Design**: Beautiful, modern UI with glassmorphism effects

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Frontend**: React 18
- **3D Graphics**: Three.js
- **React Three.js**: @react-three/fiber, @react-three/drei
- **Build Tool**: Vite
- **Icons**: Lucide React

## Installation

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install dependencies**:
```bash
bun install
```

3. **Start development server**:
```bash
bun run dev
```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Upload SVG**: Drag and drop an SVG file onto the upload area or click "Choose File"
2. **View 3D Model**: Your SVG will be automatically converted to a 3D extruded model
3. **Adjust Settings**: Use the settings panel to modify:
   - Extrusion depth and bevel properties
   - Material color, metalness, and roughness
   - Emissive properties for glow effects
4. **Export Component**: Click "Export React Component" to generate reusable code
5. **Download**: Copy the code to clipboard or download as a file

## Project Structure

```
src/
├── components/
│   ├── ExtrudedSVG.tsx      # 3D model rendering component
│   ├── ExportModal.tsx     # Code generation and export
│   └── SettingsPanel.tsx   # Real-time settings controls
├── App.tsx                 # Main application component
├── main.tsx               # Application entry point
└── index.css              # Global styles
```

## Key Components

### ExtrudedSVG Component
- Converts SVG paths to Three.js shapes
- Applies extrusion with customizable settings
- Handles geometry centering and scaling
- Supports advanced material properties

### Export Modal
- Generates React components with Three.js integration
- Supports both React and vanilla Three.js exports
- Includes customizable lighting and controls
- Provides copy-to-clipboard and download functionality

### Settings Panel
- Real-time adjustment of extrusion parameters
- Material property controls (PBR materials)
- Bevel and depth customization
- Color pickers and sliders for fine-tuning

## Advanced Features

### Material System
- **PBR Materials**: Physically-based rendering with metalness and roughness
- **Emissive Properties**: Add glow effects to your models
- **Color Customization**: Full color picker support
- **Real-time Updates**: See changes instantly

### Lighting System
- **Environment Mapping**: Studio-quality reflections
- **Multiple Light Sources**: Ambient, directional, and point lights
- **Shadow Mapping**: Realistic shadows with contact shadows
- **Professional Setup**: Optimized for 3D model presentation

### Export Options
- **React Components**: Ready-to-use React components
- **Three.js Classes**: Vanilla Three.js implementations
- **Customizable**: Include/exclude controls, lighting, and shadows
- **TypeScript Support**: Full type safety in generated code

## Development

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build

### Adding New Features

1. **New Material Properties**: Extend the material settings interface
2. **Additional Export Formats**: Add new generators to ExportModal
3. **Custom Lighting**: Modify the lighting setup in App.tsx
4. **Animation Support**: Add animation controls to ExtrudedSVG

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Tips

- Use simple SVG paths for better performance
- Avoid overly complex geometries
- Consider reducing bevel segments for large models
- Use appropriate material settings for your use case

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal and commercial purposes.

## Acknowledgments

- Three.js community for excellent 3D graphics library
- React Three Fiber for seamless React integration
- Bun team for the fast JavaScript runtime
- Lucide for beautiful icons