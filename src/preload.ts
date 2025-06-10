import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    selectFiles: () => ipcRenderer.invoke('dialog:openFiles'),
    generatePreview: (files: string[]) => ipcRenderer.invoke('files:generatePreview', files),
    combineFiles: (content: string) => ipcRenderer.invoke('files:combine', content),
    copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
});
