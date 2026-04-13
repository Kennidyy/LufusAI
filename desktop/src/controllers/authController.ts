import { ipcRenderer } from 'electron';

export class AuthController {
  async login(email: string, password: string) {
    try {
      const response = await ipcRenderer.invoke('auth:login', { email, password });
      return response;
    } catch (error) {
      return { success: false, message: 'Login failed' };
    }
  }
}