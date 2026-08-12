const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');

let mainWindow = null;
let backendProcess = null;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] Failed to start:', err.message);
  });

  backendProcess.on('exit', (code) => {
    console.log(`[Backend] Process exited with code ${code}`);
    backendProcess = null;
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
    console.log('[Backend] Process terminated');
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1400, width - 100),
    height: Math.min(900, height - 100),
    minWidth: 1000,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0e1a',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});