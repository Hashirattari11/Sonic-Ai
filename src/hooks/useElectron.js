import { useState, useEffect } from 'react';

export const useElectron = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  
  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.isMaximized().then(setIsMaximized);
      
      const unsubscribe = window.electronAPI.onMaximizeChange(setIsMaximized);
      return unsubscribe;
    }
  }, []);
  
  const minimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };
  
  const maximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximize();
    }
  };
  
  const close = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };
  
  return {
    isElectron,
    isMaximized,
    minimize,
    maximize,
    close,
    toggleMaximize: () => (isMaximized ? maximize() : maximize()),
  };
};