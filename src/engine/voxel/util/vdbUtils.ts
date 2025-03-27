/**
 * Utility functions for VDB operations
 */
import { 
    Vec3, 
    CoordKey, 
    VDBNodeType, 
    VDBLeafNode, 
    VDBInternalNode, 
    VDB_CONFIG,
    VoxelData,
  } from '../type/vdbTypes';
  
  /**
   * Create a unique key from coordinate values
   */
  export function createCoordKey(x: number, y: number, z: number): CoordKey {
    return `${x},${y},${z}`;
  }
  
  /**
   * Parse a coordinate key back into a Vec3
   */
  export function parseCoordKey(key: CoordKey): Vec3 {
    const parts = key.split(',').map(Number);
    return [parts[0], parts[1], parts[2]];
  }
  
  /**
   * Create a leaf node with empty values
   */
  export function createEmptyLeafNode(origin: Vec3): VDBLeafNode {
    const totalVoxels = VDB_CONFIG.LEAF_DIM ** 3;
    const maskSize = Math.ceil(totalVoxels / 32);
    
    return {
      type: VDBNodeType.LEAF,
      origin,
      activeMask: new Uint32Array(maskSize),
      values: new Array(totalVoxels).fill(null).map(() => ({
        density: 1.0, // Default to empty space
        materialId: 0
      }))
    };
  }
  
  /**
   * Create an empty internal node
   */
  export function createEmptyInternalNode(origin: Vec3): VDBInternalNode {
    const totalChildren = VDB_CONFIG.INTERNAL_DIM ** 3;
    const maskSize = Math.ceil(totalChildren / 32);
    
    return {
      type: VDBNodeType.INTERNAL,
      origin,
      childMask: new Uint32Array(maskSize),
      children: new Map()
    };
  }
  
  /**
   * Convert from world coordinates to voxel indices
   */
  export function worldToVoxel(worldPos: Vec3, origin: Vec3, resolution: number): Vec3 {
    return [
      Math.floor((worldPos[0] - origin[0]) / resolution),
      Math.floor((worldPos[1] - origin[1]) / resolution),
      Math.floor((worldPos[2] - origin[2]) / resolution)
    ];
  }
  
  /**
   * Convert from voxel indices to world coordinates
   */
  export function voxelToWorld(voxelPos: Vec3, origin: Vec3, resolution: number): Vec3 {
    return [
      origin[0] + voxelPos[0] * resolution,
      origin[1] + voxelPos[1] * resolution,
      origin[2] + voxelPos[2] * resolution
    ];
  }
  
  /**
   * Set a specific bit in a bitmask
   */
  export function setBit(mask: Uint32Array, bitIndex: number): void {
    const wordIndex = Math.floor(bitIndex / 32);
    const bitInWord = bitIndex % 32;
    mask[wordIndex] |= (1 << bitInWord);
  }
  
  /**
   * Clear a specific bit in a bitmask
   */
  export function clearBit(mask: Uint32Array, bitIndex: number): void {
    const wordIndex = Math.floor(bitIndex / 32);
    const bitInWord = bitIndex % 32;
    mask[wordIndex] &= ~(1 << bitInWord);
  }
  
  /**
   * Check if a specific bit is set in a bitmask
   */
  export function isBitSet(mask: Uint32Array, bitIndex: number): boolean {
    const wordIndex = Math.floor(bitIndex / 32);
    const bitInWord = bitIndex % 32;
    return (mask[wordIndex] & (1 << bitInWord)) !== 0;
  }
  
  /**
   * Convert 3D position to linear index in a leaf node
   */
  export function posToIndex(x: number, y: number, z: number, dim: number): number {
    return x + y * dim + z * dim * dim;
  }
  
  /**
   * Convert linear index to 3D position in a leaf node
   */
  export function indexToPos(index: number, dim: number): Vec3 {
    const x = index % dim;
    const y = Math.floor((index / dim) % dim);
    const z = Math.floor(index / (dim * dim));
    return [x, y, z];
  }
  
  /**
   * Get local key for a child node within parent
   */
  export function getLocalKey(childOrigin: Vec3, parentOrigin: Vec3): CoordKey {
    const localX = Math.floor((childOrigin[0] - parentOrigin[0]) / VDB_CONFIG.LEAF_DIM);
    const localY = Math.floor((childOrigin[1] - parentOrigin[1]) / VDB_CONFIG.LEAF_DIM);
    const localZ = Math.floor((childOrigin[2] - parentOrigin[2]) / VDB_CONFIG.LEAF_DIM);
    return createCoordKey(localX, localY, localZ);
  }
  
  /**
   * Get bit index for child mask
   */
  export function getChildBitIndex(childOrigin: Vec3, parentOrigin: Vec3): number {
    const localX = Math.floor((childOrigin[0] - parentOrigin[0]) / VDB_CONFIG.LEAF_DIM);
    const localY = Math.floor((childOrigin[1] - parentOrigin[1]) / VDB_CONFIG.LEAF_DIM);
    const localZ = Math.floor((childOrigin[2] - parentOrigin[2]) / VDB_CONFIG.LEAF_DIM);
    return localX + 
           localY * VDB_CONFIG.INTERNAL_DIM + 
           localZ * VDB_CONFIG.INTERNAL_DIM * VDB_CONFIG.INTERNAL_DIM;
  }
  
  /**
   * Calculate signed distance field (SDF) value for a sphere
   */
  export function sphereSDF(pos: Vec3, center: Vec3, radius: number): number {
    const dx = pos[0] - center[0];
    const dy = pos[1] - center[1];
    const dz = pos[2] - center[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz) - radius;
  }
  
  /**
   * Calculate SDF value for a box
   */
  export function boxSDF(pos: Vec3, center: Vec3, halfDimensions: Vec3): number {
    const dx = Math.abs(pos[0] - center[0]) - halfDimensions[0];
    const dy = Math.abs(pos[1] - center[1]) - halfDimensions[1];
    const dz = Math.abs(pos[2] - center[2]) - halfDimensions[2];
    
    const outsideDistance = Math.sqrt(
      Math.max(dx, 0)**2 + 
      Math.max(dy, 0)**2 + 
      Math.max(dz, 0)**2
    );
    
    const insideDistance = Math.min(Math.max(dx, Math.max(dy, dz)), 0);
    
    return outsideDistance + insideDistance;
  }
  
  /**
   * Count active voxels in a leaf node
   */
  export function countActiveVoxels(leaf: VDBLeafNode): number {
    let count = 0;
    for (let i = 0; i < leaf.activeMask.length; i++) {
      let mask = leaf.activeMask[i];
      while (mask) {
        if (mask & 1) count++;
        mask >>>= 1;
      }
    }
    return count;
  }
  
  /**
   * Get the value of a specific voxel in a leaf node
   */
  export function getVoxelValue(
    leaf: VDBLeafNode, 
    localX: number, 
    localY: number, 
    localZ: number
  ): VoxelData | null {
    if (localX < 0 || localX >= VDB_CONFIG.LEAF_DIM ||
        localY < 0 || localY >= VDB_CONFIG.LEAF_DIM ||
        localZ < 0 || localZ >= VDB_CONFIG.LEAF_DIM) {
      return null;
    }
    
    const index = posToIndex(localX, localY, localZ, VDB_CONFIG.LEAF_DIM);
    
    // Check if voxel is active
    if (!isBitSet(leaf.activeMask, index)) {
      return null;
    }
    
    return leaf.values[index];
  }
  
  /**
   * Set the value of a specific voxel in a leaf node
   */
  export function setVoxelValue(
    leaf: VDBLeafNode, 
    localX: number, 
    localY: number, 
    localZ: number,
    value: VoxelData,
    active: boolean = true
  ): void {
    if (localX < 0 || localX >= VDB_CONFIG.LEAF_DIM ||
        localY < 0 || localY >= VDB_CONFIG.LEAF_DIM ||
        localZ < 0 || localZ >= VDB_CONFIG.LEAF_DIM) {
      return;
    }
    
    const index = posToIndex(localX, localY, localZ, VDB_CONFIG.LEAF_DIM);
    
    // Set or clear the active bit
    if (active) {
      setBit(leaf.activeMask, index);
    } else {
      clearBit(leaf.activeMask, index);
    }
    
    // Set the value
    leaf.values[index] = value;
  }