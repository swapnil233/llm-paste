import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for better type safety
interface ElectronAPI {
    selectFiles: () => Promise<string[]>;
    selectFolders: () => Promise<string[]>;
    generatePreview: (files: string[], dragDropFiles: Array<{ name: string, content: string }>) => Promise<{ content: string; tokenCount: number; fileCount: number; files: string[] }>;
    getTokenCounts: (files: string[], dragDropFiles: Array<{ name: string, content: string }>) => Promise<Record<string, number>>;
    combineFiles: (content: string) => Promise<{ dest: string }>;
    copyToClipboard: (text: string) => Promise<boolean>;
    shouldUseDarkColors: () => Promise<boolean>;
    setTheme: (theme: 'system' | 'light' | 'dark') => Promise<boolean>;
}

// Create the API object
const api: ElectronAPI = {
    selectFiles: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFiles'),
    selectFolders: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFolders'),
    generatePreview: (files: string[], dragDropFiles: Array<{ name: string, content: string }>) => ipcRenderer.invoke('files:generatePreview', files, dragDropFiles),
    getTokenCounts: (files: string[], dragDropFiles: Array<{ name: string, content: string }>) => ipcRenderer.invoke('files:getTokenCounts', files, dragDropFiles),
    combineFiles: (content: string) => ipcRenderer.invoke('files:combine', content),
    copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
    shouldUseDarkColors: () => ipcRenderer.invoke('theme:shouldUseDarkColors'),
    setTheme: (theme: 'system' | 'light' | 'dark') => ipcRenderer.invoke('theme:setTheme', theme),
};

// Expose a focused, secure API to the renderer process
contextBridge.exposeInMainWorld('api', Object.freeze(api));

// Export the type for React components to use
export type { ElectronAPI };
