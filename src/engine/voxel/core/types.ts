/**
 * Core voxel data structures that can represent both VDB and VOX formats
 */

// Basic math types
export type Vec3 = [number, number, number];
export type Matrix4x4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

// Material definition for voxels
export interface Material {
  id: number;
  albedo: Vec3;
  metallic: number;
  roughness: number;
  emission: Vec3;
  opacity?: number;
}

// Core voxel data
export interface VoxelData {
  // For SDF-based volumes (VDB)
  density?: number;
  
  // For discrete voxels (VOX)
  colorIndex?: number;
  
  // Shared properties
  materialId: number;
}

// Volume bounding box
export interface BoundingBox {
  min: Vec3;
  max: Vec3;
}

// Supported voxel types
export enum VoxelModelType {
  DISCRETE = 'discrete',   // Regular voxels (VOX-like)
  SDF = 'sdf',             // Signed Distance Field (VDB-like)
  HYBRID = 'hybrid'        // Supports both representations
}

// Source format that created this voxel data
export enum VoxelSourceFormat {
  VOX = 'vox',
  VDB = 'vdb',
  NATIVE = 'native',
  PROCEDURAL = 'procedural'
}

// Storage methods for the voxel data
export enum VoxelStorageMethod {
  DENSE_GRID = 'dense_grid',      // Regular 3D array
  SPARSE_OCTREE = 'sparse_octree', // Octree for sparse data
  VDB_TREE = 'vdb_tree',          // VDB's tree structure
  HASH_TABLE = 'hash_table'       // Hash table for position -> voxel
}

// Default configuration and constants
export const VOXEL_CONFIG = {
  DEFAULT_RESOLUTION: 0.1,        // Default voxel size in world units
  DEFAULT_TRANSFORM: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as Matrix4x4,
  MAX_MATERIALS: 256,             // Maximum number of materials
};

// Unified voxel model interface
export interface VoxelModel {
  // Identification
  id: string;
  name: string;
  
  // Creation metadata
  createdAt: Date;
  updatedAt: Date;
  sourceFormat: VoxelSourceFormat;
  
  // Type and storage info
  modelType: VoxelModelType;
  storageMethod: VoxelStorageMethod;
  
  // Spatial information
  resolution: number;
  origin: Vec3;
  dimensions: Vec3;
  worldBounds: BoundingBox;
  transform: Matrix4x4;
  
  // Material information
  materials: Material[];
  
  // The actual voxel data will be accessed through methods
  // to allow for different internal representations
  getVoxelAt(x: number, y: number, z: number): VoxelData | null;
  setVoxelAt(x: number, y: number, z: number, data: VoxelData): void;
  getVoxelCount(): number;
  
  // For SDF-specific operations (optional)
  sampleAt?(worldX: number, worldY: number, worldZ: number): number;
  
  // Serialization support
  toBuffer?(): ArrayBuffer;
  toJSON?(): any;
}