/**
 * Core VDB data structure types for the voxel engine
 * These provide the foundation for storing and manipulating VDB volumes
 */

// Configuration constants
export const VDB_CONFIG = {
    LEAF_DIM: 8,              // 8³ voxels per leaf node
    INTERNAL_DIM: 4,          // 4³ child nodes per internal node
    DEFAULT_TRANSFORM: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const
  };
  
  // Basic math types
  export type Vec3 = [number, number, number];
  export type Matrix4x4 = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
  ];
  
  // Coordinate key for hash tables
  export type CoordKey = string; // Format: "x,y,z"
  
  // Material definition for voxels
  export interface Material {
    id: number;
    albedo: Vec3;
    metallic: number;
    roughness: number;
    emission: Vec3;
  }
  
  // Core voxel data
  export interface VoxelData {
    density: number;    // Signed distance field value
    materialId: number; // Index into material table
    // Optional attributes for different simulation types
    temperature?: number;
    velocity?: Vec3;
  }
  
  // Node types
  export enum VDBNodeType {
    INTERNAL = 'internal',
    LEAF = 'leaf'
  }
  
  // Base node interface
  export interface VDBNode {
    readonly type: VDBNodeType;
    origin: Vec3;
  }
  
  // Leaf node containing actual voxel data
  export interface VDBLeafNode extends VDBNode {
    readonly type: VDBNodeType.LEAF;
    // Bit mask indicating which voxels are active
    activeMask: Uint32Array;
    // Actual voxel data, stored as a flat array (x + y*dim + z*dim*dim)
    values: VoxelData[];
  }
  
  // Internal node containing child pointers
  export interface VDBInternalNode extends VDBNode {
    readonly type: VDBNodeType.INTERNAL;
    // Bit mask indicating which child nodes are active
    childMask: Uint32Array;
    // Map from child coordinates to node references
    children: Map<string | number, VDBLeafNode>;
  }
  
  // Root structure for the VDB volume
  export interface VDBRoot {
    // Map from global coordinates to root-level node references
    nodes: Map<CoordKey, VDBInternalNode>;
  }
  
  // Volume types
  export enum VDBVolumeType {
    STATIC = 'static',
    SIMULATION = 'simulation',
    INSTANCE = 'instance'
  }
  
  // Simulation types
  export enum SimulationType {
    SMOKE = 'smoke',
    FIRE = 'fire',
    LIQUID = 'liquid'
  }
  
  // Simulation properties
  export interface SimulationProperties {
    type: SimulationType;
    timestep: number;
    iterations: number;
  }
  
  // Complete VDB volume with metadata
  export interface VDBVolume {
    // Metadata
    name: string;
    uuid: string;
    createdAt: Date;
    updatedAt: Date;
    
    // Transform from local to world space
    transform: Matrix4x4;
    
    // Physical bounds in world space
    worldBounds: {
      min: Vec3;
      max: Vec3;
    };
    
    // Voxel resolution (size of a voxel in world units)
    resolution: number;
    
    // Material definitions
    materials: Material[];
    
    // Root of the tree structure
    root: VDBRoot;
    
    // Additional properties for specific volume types
    volumeType: VDBVolumeType;
    simulationProperties?: SimulationProperties;
  }
  
  // VDB file header (simplified version for our custom format)
  export interface VDBFileHeader {
    magic: string;      // Should be "VOXL"
    version: number;    // Format version
    volumeCount: number; // Number of volumes in the file
    flags: number;      // Additional flags
  }
  
  // Grid descriptor in file
  export interface VDBGridDescriptor {
    name: string;
    uuid: string;
    volumeType: VDBVolumeType;
    resolution: number;
    bbox: {
      min: Vec3;
      max: Vec3;
    };
    transform: Matrix4x4;
  }