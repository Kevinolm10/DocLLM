import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // File operations
    importTextFile: () => ipcRenderer.invoke('import-text-file'),
    
    // Document operations
    loadDocuments: () => ipcRenderer.invoke('load-documents'),
    saveDocuments: (documents: any) => ipcRenderer.invoke('save-documents', documents),
});