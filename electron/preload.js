const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('maximize-change', listener);
    return () => ipcRenderer.removeListener('maximize-change', listener);
  },
  baseUrl: 'http://127.0.0.1:8000',
});

contextBridge.exposeInMainWorld('versions', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
});