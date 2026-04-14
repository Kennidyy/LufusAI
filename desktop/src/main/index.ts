import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import { app, BrowserWindow, ipcMain } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ENV_FILE = path.join(rootDir, '.env');

if (existsSync(ENV_FILE)) {
  const envContent = readFileSync(ENV_FILE, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !line.startsWith('#')) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

async function startServer() {
  if (serverProcess) return;
  
  console.log('Starting backend server...');
  
  const projectRoot = path.resolve(__dirname, '../../..');
  const env = { ...process.env };
  
  if (existsSync(path.join(projectRoot, '.env'))) {
    const envContent = readFileSync(path.join(projectRoot, '.env'), 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !line.startsWith('#')) {
        env[match[1].trim()] = match[2].trim();
      }
    });
  }
  
  serverProcess = spawn('bun', ['run', 'src/server.ts'], {
    cwd: projectRoot,
    env,
    stdio: 'pipe'
  });
  
  serverProcess.stdout?.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  serverProcess.stderr?.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });
  
  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    serverProcess = null;
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}

function stopServer() {
  if (serverProcess) {
    console.log('Stopping backend server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

app.whenReady().then(async () => {
  await startServer();
  
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 360,
    minHeight: 500,
    resizable: true,
    frame: false,
    backgroundColor: '#171717',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.loadFile(path.join(__dirname, '../views/index.html'));

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:fullscreen', () => {
    mainWindow?.setFullScreen(!mainWindow?.isFullScreen());
  });
  ipcMain.handle('window:close', () => mainWindow?.close());

  app.setAboutPanelOptions({ applicationName: 'LufusAI', applicationVersion: '1.0.0' });
});

app.on('window-all-closed', () => {
  stopServer();
  app.quit();
});

app.on('before-quit', () => {
  stopServer();
});
