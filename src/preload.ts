import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    selectFiles: () => ipcRenderer.invoke('dialog:openFiles'),
    addFile: () => ipcRenderer.invoke('dialog:addFile'),
    combineFiles: (files: string[]) => ipcRenderer.invoke('files:combine', files),
});
