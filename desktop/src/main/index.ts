import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

export { rootDir, ENV_FILE };

import { app, BrowserWindow, ipcMain } from 'electron';

const SESSION_FILE = path.join(rootDir, '.lufus-session');

let mainWindow: BrowserWindow | null = null;

let uuidGenerator: any;
let userRepository: any;
let emailValidator: any;
let passwordHash: any;
let sessionStore: any;
let LoginUseCase: any;
let LogoutUseCase: any;
let GetCurrentUserUseCase: any;

async function initDeps() {
  if (uuidGenerator) return;
  
  const { DrizzleUserRepository } = await import('@/infrastructure/persistence/repositories/DrizzleUserRepository.ts');
  const { UuidGenerator } = await import('@/infrastructure/uuid/UuidGenerator.ts');
  const { EmailValidator } = await import('@/infrastructure/validators/EmailValidator.ts');
  const { Argon2NodePasswordHash } = await import('@/infrastructure/cryptography/Argon2NodePasswordHash.ts');
  const { LoginUseCase: LC, LogoutUseCase: LOC, GetCurrentUserUseCase: GCU } = await import('@/application/use-cases/AuthUseCases.ts');
  const { FileSessionStore } = await import('@/shared/security/SessionManager.ts');

  uuidGenerator = new UuidGenerator();
  userRepository = new DrizzleUserRepository(uuidGenerator);
  emailValidator = new EmailValidator();
  passwordHash = new Argon2NodePasswordHash();
  sessionStore = new FileSessionStore();
  LoginUseCase = LC;
  LogoutUseCase = LOC;
  GetCurrentUserUseCase = GCU;
}

app.whenReady().then(async () => {
  await initDeps();
  
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    resizable: false,
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
  ipcMain.handle('window:close', () => mainWindow?.close());

  ipcMain.handle('auth:login', async (_event, data) => {
    try {
      await initDeps();
      const loginUseCase = new LoginUseCase(userRepository, passwordHash, sessionStore);
      const result = await loginUseCase.execute({ email: data.email, password: data.password });

      storeToken(result.token, {
        userId: result.userId,
        email: result.email,
        name: result.name
      });

      return {
        success: true,
        message: 'Login bem-sucedido',
        user: { id: result.userId, email: result.email, name: result.name }
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro ao fazer login' };
    }
  });

  ipcMain.handle('auth:get-session', async () => {
    const token = getStoredToken();
    if (!token) return { authenticated: false };

    try {
      await initDeps();
      const getCurrentUserUseCase = new GetCurrentUserUseCase(sessionStore);
      const user = getCurrentUserUseCase.execute(token);
      return { authenticated: true, user };
    } catch {
      return { authenticated: false };
    }
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      await initDeps();
      const token = getStoredToken();
      if (token) {
        const logoutUseCase = new LogoutUseCase(sessionStore);
        logoutUseCase.execute(token);
      }
    } catch {}
    return { success: true };
  });

  app.setAboutPanelOptions({ applicationName: 'LufusAI', applicationVersion: '1.0.0' });
});

function storeToken(token: string, userData: { userId: string; email: string; name: string }): void {
  try {
    const fs = require('fs');
    let sessions: Record<string, unknown> = {};
    if (fs.existsSync(SESSION_FILE)) {
      sessions = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    }
    sessions[token] = { ...userData, createdAt: Date.now(), expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error('Failed to store session:', e);
  }
}

function getStoredToken(): string | null {
  try {
    const fs = require('fs');
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, 'utf-8');
      const sessions = JSON.parse(data);
      for (const token of Object.keys(sessions)) return token;
    }
  } catch {}
  return null;
}