import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './shared/ipc';

const api: ElectronAPI = {
    openProject: () => ipcRenderer.invoke('project:openProject'),
    selectFiles: () => ipcRenderer.invoke('dialog:openFiles'),
    selectFolders: () => ipcRenderer.invoke('dialog:openFolders'),
    generatePreview: (files, dragDropFiles) => ipcRenderer.invoke('files:generatePreview', files, dragDropFiles),
    combineFiles: (content) => ipcRenderer.invoke('files:combine', content),
    copyToClipboard: (text) => ipcRenderer.invoke('clipboard:writeText', text),
    shouldUseDarkColors: () => ipcRenderer.invoke('theme:shouldUseDarkColors'),
    setTheme: (theme) => ipcRenderer.invoke('theme:setTheme', theme),
};

contextBridge.exposeInMainWorld('api', Object.freeze(api));

export type { ElectronAPI };
