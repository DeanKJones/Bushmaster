/**
 * Types for .vox file format (MagicaVoxel)
 * Based on MagicaVoxel .vox format specification:
 * https://github.com/ephtracy/voxel-model/blob/master/MagicaVoxel-file-format-vox.txt
 */

import { Vec3, Material } from '../core/types';

// Magic number for .vox files: "VOX "
export const VOX_MAGIC = 0x20584F56;

// Default MagicaVoxel palette
export const DEFAULT_PALETTE: number[] = [
  0x00000000, 0xffffffff, 0xffccffff, 0xff99ffff, 0xff66ffff, 0xff33ffff, 0xff00ffff, 0xffffccff,
  0xffccccff, 0xff99ccff, 0xff66ccff, 0xff33ccff, 0xff00ccff, 0xffff99ff, 0xffcc99ff, 0xff9999ff,
  // ... (truncated for brevity - full palette should have 256 colors)
  // The rest of the palette is initialized with grays
];

// Voxel Data ID Types
export enum ChunkId {
  MAIN = 'MAIN',
  SIZE = 'SIZE',
  XYZI = 'XYZI',
  RGBA = 'RGBA',
  MATT = 'MATT',
  PACK = 'PACK',
  nTRN = 'nTRN',
  nGRP = 'nGRP',
  nSHP = 'nSHP',
  LAYR = 'LAYR',
  MATL = 'MATL',
  rOBJ = 'rOBJ',
  IMAP = 'IMAP'
}

// .vox file header
export interface VoxHeader {
  magic: number;        // Magic number: "VOX "
  version: number;      // Version number (current is 150)
}

// Main chunk - contains all other chunks
export interface VoxMainChunk {
  sizeX: number;        // Size of model X dimension
  sizeY: number;        // Size of model Y dimension
  sizeZ: number;        // Size of model Z dimension
  voxels: VoxVoxel[];   // Array of voxels
  palette: number[];    // RGBA palette (array of 256 colors)
  materials: VoxMaterial[]; // Array of materials (if present)
}

// Individual voxel in .vox file
export interface VoxVoxel {
  x: number;           // X position
  y: number;           // Y position
  z: number;           // Z position
  colorIndex: number;  // Palette index (0-255)
}

// Material definitions
export interface VoxMaterial {
  id: number;           // Material ID
  type: number;         // Material type (0=diffuse, 1=metal, 2=glass, 3=emissive)
  weight: number;       // Material weight (0-1)
  properties: Record<string, string>; // Material properties
}

// Object for scene graph nodes
export interface VoxSceneNode {
  id: number;           // Node ID
  attributes: Record<string, string>; // Node attributes
  childNodes: VoxSceneNode[]; // Child nodes
  models?: number[];    // IDs of models (for shape nodes)
  transform?: {         // Transform information (for transform nodes)
    translation: Vec3,
    rotation: number[], // Rotation matrix or quaternion
    scale: Vec3
  };
}

// Represents a complete .vox file
export interface VoxFile {
  header: VoxHeader;
  models: VoxMainChunk[];      // Multiple models can be in a single file
  scene?: {                     // Optional scene data
    rootNode: VoxSceneNode;    // Root of scene graph
  };
  worldOffset?: Vec3;          // World offset for the model
}

// Intermediate conversion format
export interface VoxModelData {
  dimensions: Vec3;           // Size of the model
  voxels: Map<string, number>; // Position -> Color index map
  palette: number[];          // RGBA palette values
  materials: VoxMaterial[];   // Materials
}

// Converted format ready for VDB integration
export interface ConvertedVoxModel {
  name: string;
  dimensions: Vec3;
  origin: Vec3;
  voxels: Map<string, {
    colorIndex: number;
    materialIndex: number;
  }>;
  palette: number[];
  materials: Material[];
}