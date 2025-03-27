/**
 * Integration module for the unified voxel system
 * Connects the voxel functionality with the rest of the engine
 */
import { VoxelManager } from '../voxelManager';
import { EventSystem } from '../../events/eventSystem';
import { VoxelSourceFormat } from '../core/types';

/**
 * Initialize the voxel subsystem
 */
export function initializeVoxelSystem(): VoxelManager {
  console.log('Initializing unified voxel system...');
  
  // Get manager instance
  const voxelManager = VoxelManager.getInstance();
  
  // Set up event listeners
  setupEventListeners(voxelManager);
  
  // Create test models
  voxelManager.createTestVoxModel();
  voxelManager.createTestVdbModel();
  
  return voxelManager;
}

/**
 * Set up event listeners for voxel-related events
 * @param voxelManager The voxel manager instance
 */
function setupEventListeners(voxelManager: VoxelManager): void {
  const eventSystem = EventSystem.getInstance();
  
  // Listen for model loading
  eventSystem.on('voxel:model-loaded', (event) => {
    console.log(`Model loaded: ${event.name} (${event.modelId}) - Format: ${event.format}`);
    
    // Automatically activate the model
    voxelManager.activateModel(event.modelId);
  });
  
  // Listen for model creation
  eventSystem.on('voxel:model-created', (event) => {
    console.log(`Model created: ${event.name} (${event.modelId}) - Format: ${event.format}`);
    
    // Automatically activate the model
    voxelManager.activateModel(event.modelId);
  });
  
  // Listen for model activation/deactivation
  eventSystem.on('voxel:model-activated', (event) => {
    console.log(`Model activated: ${event.modelId}`);
  });
  
  eventSystem.on('voxel:model-deactivated', (event) => {
    console.log(`Model deactivated: ${event.modelId}`);
  });
  
  // Listen for model deletion
  eventSystem.on('voxel:model-deleted', (event) => {
    console.log(`Model deleted: ${event.modelId}`);
  });
}

/**
 * Load a VOX file from a user-selected file input
 * @param input The file input element
 * @returns Promise that resolves when the file is loaded
 */
export async function loadVoxFromFileInput(input: HTMLInputElement): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!input.files || input.files.length === 0) {
      reject(new Error('No file selected'));
      return;
    }
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target || !e.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        const buffer = e.target.result as ArrayBuffer;
        const voxelManager = VoxelManager.getInstance();
        const modelIds = await voxelManager.importVoxFromBuffer(buffer, file.name.replace('.vox', ''));
        
        resolve(modelIds);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Load a VDB file from a user-selected file input
 * @param input The file input element
 * @returns Promise that resolves when the file is loaded
 */
export async function loadVdbFromFileInput(input: HTMLInputElement): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!input.files || input.files.length === 0) {
      reject(new Error('No file selected'));
      return;
    }
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target || !e.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        const buffer = e.target.result as ArrayBuffer;
        const voxelManager = VoxelManager.getInstance();
        const modelIds = await voxelManager.importVdbFromBuffer(buffer);
        
        resolve(modelIds);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Create a test UI for the unified voxel system
 */
export function createVoxelTestUI(): void {
  // Create UI container
  const container = document.createElement('div');
  container.className = 'voxel-test-ui';
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.color = 'white';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.zIndex = '1000';
  container.style.maxWidth = '300px';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Unified Voxel System';
  title.style.margin = '0 0 10px 0';
  container.appendChild(title);
  
  // Test model creation buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '5px';
  buttonContainer.style.marginBottom = '10px';
  
  const createVoxBtn = document.createElement('button');
  createVoxBtn.textContent = 'Create Test VOX';
  createVoxBtn.style.flex = '1';
  createVoxBtn.addEventListener('click', () => {
    const voxelManager = VoxelManager.getInstance();
    voxelManager.createTestVoxModel();
    updateModelList();
  });
  buttonContainer.appendChild(createVoxBtn);
  
  const createVdbBtn = document.createElement('button');
  createVdbBtn.textContent = 'Create Test VDB';
  createVdbBtn.style.flex = '1';
  createVdbBtn.addEventListener('click', () => {
    const voxelManager = VoxelManager.getInstance();
    voxelManager.createTestVdbModel();
    updateModelList();
  });
  buttonContainer.appendChild(createVdbBtn);
  
  container.appendChild(buttonContainer);
  
  // File input for loading VOX
  const voxFileInput = document.createElement('input');
  voxFileInput.type = 'file';
  voxFileInput.accept = '.vox';
  voxFileInput.style.display = 'none';
  
  const voxFileBtn = document.createElement('button');
  voxFileBtn.textContent = 'Load VOX File';
  voxFileBtn.style.display = 'block';
  voxFileBtn.style.width = '100%';
  voxFileBtn.style.marginBottom = '5px';
  
  voxFileBtn.addEventListener('click', () => {
    voxFileInput.click();
  });
  
  voxFileInput.addEventListener('change', async () => {
    try {
      const modelIds = await loadVoxFromFileInput(voxFileInput);
      console.log(`Loaded VOX models: ${modelIds.join(', ')}`);
      updateModelList();
    } catch (error) {
      console.error('Failed to load VOX file:', error);
      alert(`Failed to load VOX file: ${error}`);
    }
  });
  
  container.appendChild(voxFileBtn);
  container.appendChild(voxFileInput);
  
  // File input for loading VDB
  const vdbFileInput = document.createElement('input');
  vdbFileInput.type = 'file';
  vdbFileInput.accept = '.vdb';
  vdbFileInput.style.display = 'none';
  
  const vdbFileBtn = document.createElement('button');
  vdbFileBtn.textContent = 'Load VDB File';
  vdbFileBtn.style.display = 'block';
  vdbFileBtn.style.width = '100%';
  vdbFileBtn.style.marginBottom = '10px';
  
  vdbFileBtn.addEventListener('click', () => {
    vdbFileInput.click();
  });
  
  vdbFileInput.addEventListener('change', async () => {
    try {
      const modelIds = await loadVdbFromFileInput(vdbFileInput);
      console.log(`Loaded VDB models: ${modelIds.join(', ')}`);
      updateModelList();
    } catch (error) {
      console.error('Failed to load VDB file:', error);
      alert(`Failed to load VDB file: ${error}`);
    }
  });
  
  container.appendChild(vdbFileBtn);
  container.appendChild(vdbFileInput);
  
  // Model list
  const modelListContainer = document.createElement('div');
  modelListContainer.style.maxHeight = '250px';
  modelListContainer.style.overflowY = 'auto';
  
  const modelListTitle = document.createElement('h4');
  modelListTitle.textContent = 'Loaded Models';
  modelListTitle.style.margin = '0 0 5px 0';
  modelListContainer.appendChild(modelListTitle);
  
  const modelList = document.createElement('ul');
  modelList.style.listStyle = 'none';
  modelList.style.padding = '0';
  modelList.style.margin = '0';
  modelListContainer.appendChild(modelList);
  
  container.appendChild(modelListContainer);
  
  // Update model list function
  function updateModelList() {
    modelList.innerHTML = '';
    const voxelManager = VoxelManager.getInstance();
    const summaries = voxelManager.getModelSummaries();
    
    if (summaries.length === 0) {
      const noModels = document.createElement('li');
      noModels.textContent = 'No models loaded';
      noModels.style.fontStyle = 'italic';
      noModels.style.color = '#aaa';
      modelList.appendChild(noModels);
      return;
    }
    
    for (const summary of summaries) {
      const item = document.createElement('li');
      item.style.marginBottom = '8px';
      item.style.padding = '8px';
      
      // Set background color based on format
      if (summary.format === VoxelSourceFormat.VOX) {
        item.style.backgroundColor = 'rgba(100, 100, 255, 0.2)';
        item.style.borderLeft = '3px solid rgba(100, 100, 255, 0.7)';
      } else if (summary.format === VoxelSourceFormat.VDB) {
        item.style.backgroundColor = 'rgba(100, 255, 100, 0.2)';
        item.style.borderLeft = '3px solid rgba(100, 255, 100, 0.7)';
      } else {
        item.style.backgroundColor = 'rgba(200, 200, 200, 0.1)';
      }
      
      item.style.borderRadius = '3px';
      
      // Create active/inactive marker
      const activeMarker = document.createElement('div');
      activeMarker.style.width = '8px';
      activeMarker.style.height = '8px';
      activeMarker.style.borderRadius = '50%';
      activeMarker.style.background = summary.isActive ? '#4CAF50' : '#ccc';
      activeMarker.style.display = 'inline-block';
      activeMarker.style.marginRight = '5px';
      
      // Name and ID
      const itemName = document.createElement('div');
      itemName.appendChild(activeMarker);
      itemName.appendChild(document.createTextNode(`${summary.name} (${summary.id.substring(0, 6)}...)`));
      itemName.style.fontWeight = 'bold';
      itemName.style.marginBottom = '3px';
      item.appendChild(itemName);
      
      // Type and format
      const itemType = document.createElement('div');
      itemType.textContent = `Type: ${summary.type}, Format: ${summary.format}`;
      itemType.style.fontSize = '0.8em';
      itemType.style.color = '#ccc';
      item.appendChild(itemType);
      
      // Dimensions and voxel count
      const itemDetails = document.createElement('div');
      itemDetails.textContent = `Size: ${summary.dimensions[0].toFixed(1)}×${summary.dimensions[1].toFixed(1)}×${summary.dimensions[2].toFixed(1)}, Voxels: ${summary.voxelCount}`;
      itemDetails.style.fontSize = '0.8em';
      item.appendChild(itemDetails);
      
      // Button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '5px';
      buttonContainer.style.marginTop = '5px';
      
      // Toggle activation button
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = summary.isActive ? 'Deactivate' : 'Activate';
      toggleBtn.style.padding = '2px 5px';
      toggleBtn.style.fontSize = '0.8em';
      toggleBtn.addEventListener('click', () => {
        const voxelManager = VoxelManager.getInstance();
        if (summary.isActive) {
          voxelManager.deactivateModel(summary.id);
        } else {
          voxelManager.activateModel(summary.id);
        }
        updateModelList();
      });
      buttonContainer.appendChild(toggleBtn);
      
      // Debug button
      const debugBtn = document.createElement('button');
      debugBtn.textContent = 'Debug';
      debugBtn.style.padding = '2px 5px';
      debugBtn.style.fontSize = '0.8em';
      debugBtn.addEventListener('click', () => {
        const voxelManager = VoxelManager.getInstance();
        voxelManager.debugModel(summary.id);
      });
      buttonContainer.appendChild(debugBtn);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.padding = '2px 5px';
      deleteBtn.style.fontSize = '0.8em';
      deleteBtn.style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
      deleteBtn.addEventListener('click', () => {
        const voxelManager = VoxelManager.getInstance();
        voxelManager.deleteModel(summary.id);
        updateModelList();
      });
      buttonContainer.appendChild(deleteBtn);
      
      item.appendChild(buttonContainer);
      modelList.appendChild(item);
    }
  }
  
  // Initial update
  updateModelList();
  
  // Clear all button
  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = 'Clear All Models';
  clearAllBtn.style.display = 'block';
  clearAllBtn.style.width = '100%';
  clearAllBtn.style.margin = '10px 0 0 0';
  clearAllBtn.style.padding = '5px';
  clearAllBtn.style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all models?')) {
      const voxelManager = VoxelManager.getInstance();
      voxelManager.clearAllModels();
      updateModelList();
    }
  });
  container.appendChild(clearAllBtn);
  
  // Add the container to the document
  document.body.appendChild(container);
  
  // Set up event listeners for automatic updates
  const eventSystem = EventSystem.getInstance();
  const events = [
    'voxel:model-loaded',
    'voxel:model-created',
    'voxel:model-activated',
    'voxel:model-deactivated',
    'voxel:model-deleted',
    'voxel:all-models-cleared'
  ];
  
  events.forEach(eventName => {
    eventSystem.on(eventName, () => {
      updateModelList();
    });
  });
}