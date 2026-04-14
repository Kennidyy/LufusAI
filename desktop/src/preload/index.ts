const { contextBridge, ipcRenderer } = require('electron');

const API_BASE = 'http://localhost:3001';

let authToken = null;

async function apiRequest(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });
    
    return response.json();
}

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    fullscreen: () => ipcRenderer.invoke('window:fullscreen'),
    close: () => ipcRenderer.invoke('window:close'),
    
    register: async (data) => {
        return apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    login: async (data) => {
        const result = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (result.success && result.token) {
            authToken = result.token;
        }
        return result;
    },
    
    logout: async () => {
        await apiRequest('/api/auth/logout', { method: 'POST' });
        authToken = null;
    },
    
    getSession: async () => {
        const result = await apiRequest('/api/auth/me');
        return result;
    },
    
    getBalance: async () => {
        return apiRequest('/api/wallet/balance');
    },
    
    addPoints: async (amount) => {
        return apiRequest('/api/wallet/add-points', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    },
    
    removePoints: async (amount) => {
        return apiRequest('/api/wallet/remove-points', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    },
    
    getLeaderboard: async () => {
        return apiRequest('/api/leaderboard');
    },
    
    getAdminUsers: async () => {
        return apiRequest('/api/admin/users');
    },
    
    adminAddPoints: async (userId, amount) => {
        return apiRequest('/api/admin/add-points-to-user', {
            method: 'POST',
            body: JSON.stringify({ userId, amount })
        });
    },
    
    adminRemovePoints: async (userId, amount) => {
        return apiRequest('/api/admin/remove-points-from-user', {
            method: 'POST',
            body: JSON.stringify({ userId, amount })
        });
    },
    
    getAdminStats: async () => {
        return apiRequest('/api/admin/stats');
    },
    
    deleteUser: async (userId) => {
        return apiRequest(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }
});
