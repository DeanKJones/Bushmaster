/**
 * Parser for MagicaVoxel .vox files
 * Implements the VOX format specification
 */
import { 
    VoxHeader,
    VoxFile,
    VoxMainChunk,
    VoxVoxel,
    VoxModelData,
    VoxMaterial,
    ChunkId,
    //DEFAULT_PALETTE,
    VOX_MAGIC
  } from '../type/voxTypes';
  
  import {
    createVoxelKey,
    createEmptyModelData
  } from '../util/voxUtils';
  
  /**
   * Parse a .vox file from an ArrayBuffer
   */
  export function parseVoxFile(buffer: ArrayBuffer): VoxFile {
    console.log('Parsing .vox file...');
    
    // Create DataView for reading binary data
    const view = new DataView(buffer);
    let offset = 0;
    
    // Parse header
    const header = parseHeader(view, offset);
    offset += 8; // Header is 8 bytes
    
    // Check for valid magic number
    if (header.magic !== VOX_MAGIC) {
      throw new Error('Invalid .vox file: Incorrect magic number');
    }
    
    console.log(`VOX file version: ${header.version}`);
    
    // Create result object
    const result: VoxFile = {
      header,
      models: []
    };
    
    // Temporary storage for model data
    let currentModel: VoxModelData | null = null;
    
    // Parse all chunks
    while (offset < buffer.byteLength) {
      // Read chunk header
      const chunkId = String.fromCharCode(
        view.getUint8(offset++),
        view.getUint8(offset++),
        view.getUint8(offset++),
        view.getUint8(offset++)
      );
      
      const chunkSize = view.getUint32(offset, true);
      offset += 4;
      
      const childrenSize = view.getUint32(offset, true);
      offset += 4;
      
      //const chunkContentStart = offset;
      const chunkContentEnd = offset + chunkSize;
      const chunkEnd = chunkContentEnd + childrenSize;
      
      // Process this chunk
      console.log(`Parsing chunk: ${chunkId}, size: ${chunkSize}, children: ${childrenSize}`);
      
      switch (chunkId) {
        case ChunkId.MAIN:
          // MAIN chunk is just a container for other chunks
          // Jump to content of children but don't skip the chunk itself
          break;
          
        case ChunkId.SIZE:
          // Create a new model
          if (currentModel) {
            // Save the current model if we have one
            result.models.push(parseModelData(currentModel));
          }
          
          // SIZE chunk defines model dimensions
          const sizeX = view.getUint32(offset, true);
          const sizeY = view.getUint32(offset + 4, true);
          const sizeZ = view.getUint32(offset + 8, true);
          
          console.log(`Model dimensions: ${sizeX} × ${sizeY} × ${sizeZ}`);
          
          // Create empty model with these dimensions
          currentModel = createEmptyModelData(sizeX, sizeY, sizeZ);
          
          // Skip to the next chunk
          offset = chunkContentEnd;
          break;
          
        case ChunkId.XYZI:
          if (!currentModel) {
            throw new Error('XYZI chunk found without preceding SIZE chunk');
          }
          
          // XYZI chunk contains voxel data
          const numVoxels = view.getUint32(offset, true);
          offset += 4;
          
          console.log(`Number of voxels: ${numVoxels}`);
          
          // Read each voxel
          for (let i = 0; i < numVoxels; i++) {
            const voxelOffset = offset + (i * 4);
            if (voxelOffset + 4 > chunkContentEnd) {
              console.warn(`Voxel data exceeds chunk size, stopping at ${i} of ${numVoxels}`);
              break;
            }
            
            const x = view.getUint8(voxelOffset);
            const y = view.getUint8(voxelOffset + 1);
            const z = view.getUint8(voxelOffset + 2);
            const colorIndex = view.getUint8(voxelOffset + 3);
            
            // Store voxel if it's not transparent (colorIndex 0)
            if (colorIndex > 0) {
              const key = createVoxelKey(x, y, z);
              currentModel.voxels.set(key, colorIndex);
            }
          }
          
          // Skip to the next chunk
          offset = chunkContentEnd;
          break;
          
        case ChunkId.RGBA:
          if (!currentModel) {
            throw new Error('RGBA chunk found without preceding SIZE chunk');
          }
          
          // RGBA chunk contains palette data
          // Read the 256 palette colors (255 colors + index 0 which is ignored)
          for (let i = 0; i < 256; i++) {
            const colorOffset = offset + (i * 4);
            if (colorOffset + 4 > chunkContentEnd) {
              console.warn(`Palette data exceeds chunk size, stopping at ${i} of 256`);
              break;
            }
            
            // VOX colors are stored as RGBA, we store them in the same format
            const r = view.getUint8(colorOffset);
            const g = view.getUint8(colorOffset + 1);
            const b = view.getUint8(colorOffset + 2);
            const a = view.getUint8(colorOffset + 3);
            
            // Create color value
            const color = (a << 24) | (b << 16) | (g << 8) | r;
            
            // In .vox files, the palette is indexed from 1, with 0 being transparent
            // But palette array is still 0-based
            currentModel.palette[i] = color;
          }
          
          // Skip to the next chunk
          offset = chunkContentEnd;
          break;
          
        case ChunkId.MATL:
          if (!currentModel) {
            throw new Error('MATL chunk found without preceding SIZE chunk');
          }
          
          // Parse material
          const materialId = view.getUint32(offset, true);
          offset += 4;
          
          // Parse dictionary
          const dictSize = view.getUint32(offset, true);
          offset += 4;
          
          const material: VoxMaterial = {
            id: materialId,
            type: 0, // Default to diffuse
            weight: 1.0,
            properties: {}
          };
          
          // Read key-value pairs
          for (let i = 0; i < dictSize; i++) {
            // Read key
            const keyLength = view.getUint32(offset, true);
            offset += 4;
            
            let key = '';
            for (let j = 0; j < keyLength; j++) {
              key += String.fromCharCode(view.getUint8(offset++));
            }
            
            // Read value
            const valueLength = view.getUint32(offset, true);
            offset += 4;
            
            let value = '';
            for (let j = 0; j < valueLength; j++) {
              value += String.fromCharCode(view.getUint8(offset++));
            }
            
            // Store property
            material.properties[key] = value;
            
            // Handle special properties
            if (key === '_type') {
              // Material type
              switch (value) {
                case '_diffuse': material.type = 0; break;
                case '_metal': material.type = 1; break;
                case '_glass': material.type = 2; break;
                case '_emit': material.type = 3; break;
              }
            } else if (key === '_weight') {
              material.weight = parseFloat(value);
            }
          }
          
          // Add to materials
          currentModel.materials.push(material);
          
          // Skip any remaining content
          offset = chunkContentEnd;
          break;
          
        default:
          // Skip unknown chunks
          console.log(`Skipping unknown chunk: ${chunkId}`);
          offset = chunkContentEnd;
      }
      
      // Adjust offset for next iteration
      if (offset !== chunkEnd) {
        console.log(`Adjusting offset from ${offset} to ${chunkEnd}`);
        offset = chunkEnd;
      }
    }
    
    // Add the last model if there is one
    if (currentModel) {
      result.models.push(parseModelData(currentModel));
    }
    
    if (result.models.length === 0) {
      throw new Error('No models found in .vox file');
    }
    
    console.log(`Parsing complete. Found ${result.models.length} models.`);
    return result;
  }
  
  /**
   * Parse the header from a .vox file
   */
  function parseHeader(view: DataView, offset: number): VoxHeader {
    const magic = view.getUint32(offset, false); // Magic is stored big-endian
    const version = view.getUint32(offset + 4, true);
    
    return { magic, version };
  }
  
  /**
   * Convert VoxModelData to VoxMainChunk
   */
  function parseModelData(modelData: VoxModelData): VoxMainChunk {
    // Get dimensions
    const [sizeX, sizeY, sizeZ] = modelData.dimensions;
    
    // Convert voxels from Map to array
    const voxels: VoxVoxel[] = [];
    
    for (const [key, colorIndex] of modelData.voxels.entries()) {
      const [x, y, z] = key.split(',').map(Number);
      voxels.push({ x, y, z, colorIndex });
    }
    
    return {
      sizeX,
      sizeY,
      sizeZ,
      voxels,
      palette: modelData.palette,
      materials: modelData.materials
    };
  }