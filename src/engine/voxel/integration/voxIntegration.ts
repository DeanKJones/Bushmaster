/**
 * Integration module for VOX support in the engine
 * Connects VOX functionality with the rest of the engine
 */
import { VoxManager } from '../voxManager';
import { VDBManager } from '../vdbManager';
import { EventSystem } from '../../events/eventSystem';

/**
 * Initialize the VOX subsystem
 * @param renderContext The engine's render context
 */
export function initializeVOXSystem(): VoxManager {
  console.log('Initializing VOX system...');
  
  // Get manager instances
  const voxManager = VoxManager.getInstance();
  const vdbManager = VDBManager.getInstance();
  
  // Set up event listeners
  setupEventListeners(vdbManager);
  
  // For testing, create a test model
  voxManager.createTestModel();
  
  return voxManager;
}

/**
 * Set up event listeners for VOX-related events
 * @param voxManager The VOX manager instance
 * @param vdbManager The VDB manager instance
 */
function setupEventListeners(vdbManager: VDBManager): void {
  const eventSystem = EventSystem.getInstance();
  
  // Listen for model loading
  eventSystem.on('vox:model-loaded', (event) => {
    console.log(`VOX model loaded: ${event.name} (${event.modelId})`);
  });
  
  // Listen for model creation
  eventSystem.on('vox:model-created', (event) => {
    console.log(`VOX model created: ${event.name} (${event.modelId})`);
  });
  
  // Listen for model conversion
  eventSystem.on('vox:model-converted', (event) => {
    console.log(`VOX model converted: ${event.modelId} -> VDB volume: ${event.volumeId}`);
    
    // Automatically activate the volume
    vdbManager.activateVolume(event.volumeId);
  });
  
  // Listen for model deletion
  eventSystem.on('vox:model-deleted', (event) => {
    console.log(`VOX model deleted: ${event.modelId}`);
  });
}

/**
 * Load a VOX file from a user-selected file input
 * @param input The file input element
 * @returns Promise that resolves when the file is loaded
 */
export async function loadVOXFromFileInput(input: HTMLInputElement): Promise<string[]> {
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
        const voxManager = VoxManager.getInstance();
        const modelIds = await voxManager.importVoxFromBuffer(buffer, file.name.replace('.vox', ''));
        
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
 * Create test VOX UI elements
 * Attaches a simple UI for testing VOX functionality
 */
export function createVOXTestUI(): void {
  // Create UI container
  const container = document.createElement('div');
  container.className = 'vox-test-ui';
  container.style.position = 'fixed';
  container.style.top = '300px';
  container.style.right = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.color = 'white';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.zIndex = '1000';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'VOX Test Controls';
  title.style.margin = '0 0 10px 0';
  container.appendChild(title);
  
  // Create test model button
  const createTestBtn = document.createElement('button');
  createTestBtn.textContent = 'Create Test Model';
  createTestBtn.style.display = 'block';
  createTestBtn.style.margin = '5px 0';
  createTestBtn.style.padding = '5px 10px';
  createTestBtn.addEventListener('click', () => {
    //const voxManager = VoxManager.getInstance();
    //const modelId = voxManager.createTestModel();
    updateModelList();
  });
  container.appendChild(createTestBtn);
  
  // File input for loading VOX
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.vox';
  fileInput.style.display = 'none';
  
  const fileInputLabel = document.createElement('button');
  fileInputLabel.textContent = 'Load VOX File';
  fileInputLabel.style.display = 'block';
  fileInputLabel.style.margin = '5px 0';
  fileInputLabel.style.padding = '5px 10px';
  
  fileInputLabel.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', async () => {
    try {
      const modelIds = await loadVOXFromFileInput(fileInput);
      console.log(`Loaded models: ${modelIds.join(', ')}`);
      updateModelList();
    } catch (error) {
      console.error('Failed to load VOX file:', error);
      alert(`Failed to load VOX file: ${error}`);
    }
  });
  
  container.appendChild(fileInputLabel);
  container.appendChild(fileInput);
  
  // Model list
  const modelListContainer = document.createElement('div');
  modelListContainer.style.marginTop = '10px';
  modelListContainer.style.maxHeight = '200px';
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
    const voxManager = VoxManager.getInstance();
    const summaries = voxManager.getModelSummaries();
    
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
      item.style.marginBottom = '5px';
      item.style.padding = '5px';
      item.style.backgroundColor = 'rgba(200, 200, 200, 0.1)';
      item.style.borderRadius = '3px';
      
      const itemName = document.createElement('div');
      itemName.textContent = `${summary.name} (${summary.id.substring(0, 8)}...)`;
      itemName.style.fontWeight = 'bold';
      item.appendChild(itemName);
      
      const itemDetails = document.createElement('div');
      itemDetails.textContent = `Size: ${summary.dimensions[0]}×${summary.dimensions[1]}×${summary.dimensions[2]}, Voxels: ${summary.voxelCount}`;
      itemDetails.style.fontSize = '0.9em';
      item.appendChild(itemDetails);
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '5px';
      buttonContainer.style.marginTop = '5px';
      
      // Convert to VDB button
      const convertBtn = document.createElement('button');
      convertBtn.textContent = 'Convert to VDB';
      convertBtn.style.padding = '2px 5px';
      convertBtn.style.fontSize = '0.8em';
      convertBtn.addEventListener('click', () => {
        const voxManager = VoxManager.getInstance();
        const volumeId = voxManager.convertModelToVDBVolume(summary.id, 0.1);
        if (volumeId) {
          console.log(`Converted model to VDB volume: ${volumeId}`);
        }
      });
      buttonContainer.appendChild(convertBtn);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.padding = '2px 5px';
      deleteBtn.style.fontSize = '0.8em';
      deleteBtn.style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
      deleteBtn.addEventListener('click', () => {
        const voxManager = VoxManager.getInstance();
        voxManager.deleteModel(summary.id);
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
  clearAllBtn.style.margin = '10px 0 0 0';
  clearAllBtn.style.padding = '5px 10px';
  clearAllBtn.style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all models?')) {
      const voxManager = VoxManager.getInstance();
      voxManager.clearAllModels();
      updateModelList();
    }
  });
  container.appendChild(clearAllBtn);
  
  // Add the container to the document
  document.body.appendChild(container);
  
  // Set up event listeners for automatic updates
  const eventSystem = EventSystem.getInstance();
  const events = [
    'vox:model-loaded',
    'vox:model-created',
    'vox:model-deleted',
    'vox:all-models-cleared',
    'vox:model-converted'
  ];
  
  events.forEach(eventName => {
    eventSystem.on(eventName, () => {
      updateModelList();
    });
  });
}