import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for better type safety
interface ElectronAPI {
    selectFiles: () => Promise<string[]>;
    generatePreview: (files: string[]) => Promise<{ content: string; tokenCount: number; fileCount: number }>;
    combineFiles: (content: string) => Promise<{ dest: string }>;
    copyToClipboard: (text: string) => Promise<boolean>;
}

// Expose a focused, secure API to the renderer process
contextBridge.exposeInMainWorld('api', {
    selectFiles: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFiles'),
    generatePreview: (files: string[]) => ipcRenderer.invoke('files:generatePreview', files),
    combineFiles: (content: string) => ipcRenderer.invoke('files:combine', content),
    copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
} as ElectronAPI);
