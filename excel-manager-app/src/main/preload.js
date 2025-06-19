const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: () => ipcRenderer.invoke('select-file'),
    saveFile: (data, defaultPath) => ipcRenderer.invoke('save-file', data, defaultPath)
});

// Type declarations moved to a separate .d.ts file