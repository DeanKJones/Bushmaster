/**
 * Integration module for VDB into the main engine
 * Connects VDB functionality with the rest of the engine
 */
import { VDBManager } from '../vdbManager';
import { EventSystem } from '../../events/eventSystem';

/**
 * Initialize the VDB subsystem
 * @param renderContext The engine's render context
 */
export function initializeVDBSystem(): VDBManager {
  console.log('Initializing VDB system...');
  
  // Get manager instance
  const vdbManager = VDBManager.getInstance();
  
  // Set up event listeners
  setupEventListeners(vdbManager);
  
  // For testing, create a test volume
  vdbManager.createTestVolume();
  
  return vdbManager;
}

/**
 * Set up event listeners for VDB-related events
 * @param vdbManager The VDB manager instance
 */
function setupEventListeners(vdbManager: VDBManager): void {
  const eventSystem = EventSystem.getInstance();
  
  // Listen for volume loading
  eventSystem.on('vdb:volume-loaded', (event) => {
    console.log(`Volume loaded: ${event.name} (${event.volumeId})`);
    
    // Automatically activate the volume
    vdbManager.activateVolume(event.volumeId);
  });
  
  // Listen for volume creation
  eventSystem.on('vdb:volume-created', (event) => {
    console.log(`Volume created: ${event.name} (${event.volumeId})`);
    
    // Automatically activate the volume
    vdbManager.activateVolume(event.volumeId);
  });
  
  // Listen for volume activation/deactivation
  eventSystem.on('vdb:volume-activated', (event) => {
    console.log(`Volume activated: ${event.volumeId}`);
  });
  
  eventSystem.on('vdb:volume-deactivated', (event) => {
    console.log(`Volume deactivated: ${event.volumeId}`);
  });
  
  // Listen for volume deletion
  eventSystem.on('vdb:volume-deleted', (event) => {
    console.log(`Volume deleted: ${event.volumeId}`);
  });
}

/**
 * Load a VDB file from a user-selected file input
 * @param input The file input element
 * @returns Promise that resolves when the file is loaded
 */
export async function loadVDBFromFileInput(input: HTMLInputElement): Promise<string[]> {
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
        const vdbManager = VDBManager.getInstance();
        const volumeIds = await vdbManager.loadVDBFromBuffer(buffer);
        
        resolve(volumeIds);
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
 * Create test VDB UI elements
 * Attaches a simple UI for testing VDB functionality
 */
export function createVDBTestUI(): void {
  // Create UI container
  const container = document.createElement('div');
  container.className = 'vdb-test-ui';
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.color = 'white';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.zIndex = '1000';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'VDB Test Controls';
  title.style.margin = '0 0 10px 0';
  container.appendChild(title);
  
  // Create test volume button
  const createTestBtn = document.createElement('button');
  createTestBtn.textContent = 'Create Test Volume';
  createTestBtn.style.display = 'block';
  createTestBtn.style.margin = '5px 0';
  createTestBtn.style.padding = '5px 10px';
  createTestBtn.addEventListener('click', () => {
    //const vdbManager = VDBManager.getInstance();
    //const volumeId = vdbManager.createTestVolume();
    updateVolumeList();
  });
  container.appendChild(createTestBtn);
  
  // File input for loading VDB
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.vdb';
  fileInput.style.display = 'none';
  
  const fileInputLabel = document.createElement('button');
  fileInputLabel.textContent = 'Load VDB File';
  fileInputLabel.style.display = 'block';
  fileInputLabel.style.margin = '5px 0';
  fileInputLabel.style.padding = '5px 10px';
  
  fileInputLabel.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', async () => {
    try {
      const volumeIds = await loadVDBFromFileInput(fileInput);
      console.log(`Loaded volumes: ${volumeIds.join(', ')}`);
      updateVolumeList();
    } catch (error) {
      console.error('Failed to load VDB file:', error);
      alert(`Failed to load VDB file: ${error}`);
    }
  });
  
  container.appendChild(fileInputLabel);
  container.appendChild(fileInput);
  
  // Volume list
  const volumeListContainer = document.createElement('div');
  volumeListContainer.style.marginTop = '10px';
  volumeListContainer.style.maxHeight = '200px';
  volumeListContainer.style.overflowY = 'auto';
  
  const volumeListTitle = document.createElement('h4');
  volumeListTitle.textContent = 'Loaded Volumes';
  volumeListTitle.style.margin = '0 0 5px 0';
  volumeListContainer.appendChild(volumeListTitle);
  
  const volumeList = document.createElement('ul');
  volumeList.style.listStyle = 'none';
  volumeList.style.padding = '0';
  volumeList.style.margin = '0';
  volumeListContainer.appendChild(volumeList);
  
  container.appendChild(volumeListContainer);
  
  // Update volume list function
  function updateVolumeList() {
    volumeList.innerHTML = '';
    const vdbManager = VDBManager.getInstance();
    const summaries = vdbManager.getVolumeSummaries();
    
    if (summaries.length === 0) {
      const noVolumes = document.createElement('li');
      noVolumes.textContent = 'No volumes loaded';
      noVolumes.style.fontStyle = 'italic';
      noVolumes.style.color = '#aaa';
      volumeList.appendChild(noVolumes);
      return;
    }
    
    for (const summary of summaries) {
      const item = document.createElement('li');
      item.style.marginBottom = '5px';
      item.style.padding = '5px';
      item.style.backgroundColor = summary.isActive ? 'rgba(100, 255, 100, 0.2)' : 'rgba(200, 200, 200, 0.1)';
      item.style.borderRadius = '3px';
      
      const itemName = document.createElement('div');
      itemName.textContent = `${summary.name} (${summary.id.substring(0, 8)}...)`;
      itemName.style.fontWeight = 'bold';
      item.appendChild(itemName);
      
      const itemType = document.createElement('div');
      itemType.textContent = `Type: ${summary.type}`;
      itemType.style.fontSize = '0.9em';
      item.appendChild(itemType);
      
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
        const vdbManager = VDBManager.getInstance();
        if (summary.isActive) {
          vdbManager.deactivateVolume(summary.id);
        } else {
          vdbManager.activateVolume(summary.id);
        }
        updateVolumeList();
      });
      buttonContainer.appendChild(toggleBtn);
      
      // Debug button
      const debugBtn = document.createElement('button');
      debugBtn.textContent = 'Debug';
      debugBtn.style.padding = '2px 5px';
      debugBtn.style.fontSize = '0.8em';
      debugBtn.addEventListener('click', () => {
        const vdbManager = VDBManager.getInstance();
        vdbManager.debugVolume(summary.id);
      });
      buttonContainer.appendChild(debugBtn);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.padding = '2px 5px';
      deleteBtn.style.fontSize = '0.8em';
      deleteBtn.style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
      deleteBtn.addEventListener('click', () => {
        const vdbManager = VDBManager.getInstance();
        vdbManager.deleteVolume(summary.id);
        updateVolumeList();
      });
      buttonContainer.appendChild(deleteBtn);
      
      item.appendChild(buttonContainer);
      volumeList.appendChild(item);
    }
  }
  
  // Initial update
  updateVolumeList();
  
  // Clear all button
  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = 'Clear All Volumes';
  clearAllBtn.style.display = 'block';
  clearAllBtn.style.margin = '10px 0 0 0';
  clearAllBtn.style.padding = '5px 10px';
  clearAllBtn.style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all volumes?')) {
      const vdbManager = VDBManager.getInstance();
      vdbManager.clearAllVolumes();
      updateVolumeList();
    }
  });
  container.appendChild(clearAllBtn);
  
  // Add the container to the document
  document.body.appendChild(container);
  
  // Set up event listeners for automatic updates
  const eventSystem = EventSystem.getInstance();
  const events = [
    'vdb:volume-loaded',
    'vdb:volume-created',
    'vdb:volume-activated',
    'vdb:volume-deactivated',
    'vdb:volume-deleted',
    'vdb:all-volumes-cleared'
  ];
  
  events.forEach(eventName => {
    eventSystem.on(eventName, () => {
      updateVolumeList();
    });
  });
}