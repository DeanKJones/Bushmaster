/**
 * Utility functions for .vox file parsing and manipulation
 */
import { 
    VoxVoxel, 
    VoxModelData, 
    ConvertedVoxModel,
    DEFAULT_PALETTE
  } from '../type/voxTypes';
  import { Vec3, Material } from '../core/types';
  
  /**
   * Create a key for the voxel position map
   */
  export function createVoxelKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
  
  /**
   * Parse a voxel key back into a position
   */
  export function parseVoxelKey(key: string): Vec3 {
    const [x, y, z] = key.split(',').map(Number);
    return [x, y, z];
  }
  
  /**
   * Create an empty voxel model data structure
   */
  export function createEmptyModelData(sizeX: number, sizeY: number, sizeZ: number): VoxModelData {
    return {
      dimensions: [sizeX, sizeY, sizeZ],
      voxels: new Map(),
      palette: [...DEFAULT_PALETTE], // Copy the default palette
      materials: []
    };
  }
  
  /**
   * Create a material from a color
   */
  export function createMaterialFromColor(colorRGBA: number): Material {
    // Extract RGBA components
    const r = (colorRGBA & 0xff) / 255;
    const g = ((colorRGBA >> 8) & 0xff) / 255;
    const b = ((colorRGBA >> 16) & 0xff) / 255;
    //const a = ((colorRGBA >> 24) & 0xff) / 255;
    
    return {
      id: 0, // Will be set later
      albedo: [r, g, b],
      metallic: 0.0,
      roughness: 0.8,
      emission: [0, 0, 0]
    };
  }
  
  /**
   * Convert a MagicaVoxel model to our internal format
   */
  export function convertToVDBFormat(model: VoxModelData, name: string): ConvertedVoxModel {
    const materials: Material[] = [];
    
    // Create materials from palette
    for (let i = 0; i < model.palette.length; i++) {
      if (i === 0) {
        // Skip the first color (transparent)
        continue;
      }
      
      const color = model.palette[i];
      if (color === 0) continue; // Skip unset colors
      
      const material = createMaterialFromColor(color);
      material.id = materials.length;
      materials.push(material);
    }
    
    // Create the converted model
    const convertedModel: ConvertedVoxModel = {
      name,
      dimensions: model.dimensions,
      origin: [0, 0, 0],
      voxels: new Map(),
      palette: model.palette,
      materials
    };
    
    // Convert voxels
    for (const [key, colorIndex] of model.voxels.entries()) {
      if (colorIndex === 0) continue; // Skip transparent voxels
      
      convertedModel.voxels.set(key, {
        colorIndex,
        materialIndex: Math.min(colorIndex - 1, materials.length - 1) // Adjust for 0-based materials
      });
    }
    
    return convertedModel;
  }
  
  /**
   * Extract significant bits from a value at a given position with the specified length
   */
  export function extractBits(value: number, position: number, length: number): number {
    return (value >> position) & ((1 << length) - 1);
  }
  
  /**
   * Convert MagicaVoxel coordinates to our coordinate system
   * MagicaVoxel uses Y-up, we use Y-up but need to adjust Z
   */
  export function convertVoxelCoordinates(voxel: VoxVoxel, size: Vec3): VoxVoxel {
    // MagicaVoxel has the origin at bottom left, we want it centered
    const halfX = size[0] / 2;
    const halfZ = size[2] / 2;
    
    return {
      x: voxel.x - halfX,
      y: voxel.y,
      z: halfZ - voxel.z, // Flip Z
      colorIndex: voxel.colorIndex
    };
  }
  
  /**
   * Get RGBA components from a palette color
   */
  export function colorToComponents(color: number): [number, number, number, number] {
    const r = (color) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = (color >> 16) & 0xff;
    const a = (color >> 24) & 0xff;
    return [r, g, b, a];
  }
  
  /**
   * Create a 32-bit RGBA color value from components
   */
  export function componentsToColor(r: number, g: number, b: number, a: number): number {
    return (a << 24) | (b << 16) | (g << 8) | r;
  }
  
  /**
   * Calculate a simple hash value for a voxel key
   * Used for distributing voxels into the VDB tree
   */
  export function hashVoxelKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
  
  /**
   * Check if a voxel position is on the boundary of the model
   */
  export function isVoxelOnBoundary(
    x: number, 
    y: number, 
    z: number, 
    voxels: Map<string, any>, 
    dimensions: Vec3
  ): boolean {
    // Check if the voxel is on the model boundary
    if (x === 0 || y === 0 || z === 0 || 
        x === dimensions[0] - 1 || 
        y === dimensions[1] - 1 || 
        z === dimensions[2] - 1) {
      return true;
    }
    
    // Check if any of the 6 adjacent voxels is missing
    const adjacent = [
      [x+1, y, z], [x-1, y, z],
      [x, y+1, z], [x, y-1, z],
      [x, y, z+1], [x, y, z-1]
    ];
    
    for (const [nx, ny, nz] of adjacent) {
      const key = createVoxelKey(nx, ny, nz);
      if (!voxels.has(key)) {
        return true;
      }
    }
    
    return false;
  }