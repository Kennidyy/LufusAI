declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      fullscreen: () => Promise<void>;
      close: () => Promise<void>;
      register: (data: { email: string; password: string; name: string }) => Promise<{ success: boolean; message?: string; userId?: string }>;
      login: (data: { email: string; password: string }) => Promise<{ success: boolean; message?: string; user?: { userId: string; email: string; name: string; isAdmin?: boolean } }>;
      logout: () => Promise<{ success: boolean }>;
      getSession: () => Promise<{ authenticated: boolean; user?: { userId: string; email: string; name: string; isAdmin?: boolean } }>;
      getBalance: () => Promise<{ success: boolean; balance?: number; message?: string }>;
      addPoints: (amount: number) => Promise<{ success: boolean; newBalance?: number; message?: string }>;
      removePoints: (amount: number) => Promise<{ success: boolean; newBalance?: number; message?: string }>;
      getLeaderboard: () => Promise<{ success: boolean; leaderboard?: Array<{ name: string; points: number }>; message?: string }>;
      getAdminUsers: () => Promise<{ success: boolean; users?: Array<{ id: string; name: string; email: string; points: number }>; message?: string }>;
      adminAddPoints: (userId: string, amount: number) => Promise<{ success: boolean; newBalance?: number; message?: string }>;
      adminRemovePoints: (userId: string, amount: number) => Promise<{ success: boolean; newBalance?: number; message?: string }>;
      getAdminStats: () => Promise<{ success: boolean; stats?: { totalUsers: number; totalPoints: number; topUser: { name: string; points: number } | null }; message?: string }>;
    };
  }
}

let currentView: 'login' | 'register' | 'dashboard' | 'admin' = 'login';
let currentSection: 'wallet' | 'buy' | 'use' | 'profile' | 'users' | 'stats' = 'wallet';
let currentUser: { userId: string; email: string; name: string; isAdmin?: boolean } | null = null;

document.getElementById('minimizeBtn')?.addEventListener('click', () => {
  window.electronAPI.minimize();
});

document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
  window.electronAPI.fullscreen();
});

document.getElementById('closeBtn')?.addEventListener('click', async () => {
  await window.electronAPI.logout();
  window.electronAPI.close();
});

const container = document.getElementById('container') as HTMLElement;

function showError(message: string) {
  const existingError = document.querySelector('.error-message');
  existingError?.remove();
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  container.prepend(errorDiv);
  
  setTimeout(() => errorDiv.remove(), 4000);
}

function showSuccess(message: string) {
  const existingSuccess = document.querySelector('.success-message');
  existingSuccess?.remove();
  
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  container.prepend(successDiv);
  
  setTimeout(() => successDiv.remove(), 3000);
}

function renderLoginForm() {
  currentView = 'login';
  container.innerHTML = `
    <div class="auth-container">
      <div class="logo">
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#10A37F" stroke-width="3"/>
          <path d="M14 24C14 18.477 18.477 14 24 14V34C18.477 34 14 29.523 14 24Z" fill="#10A37F"/>
          <circle cx="24" cy="24" r="6" fill="#171717"/>
        </svg>
      </div>
      
      <h1>LufusAI</h1>
      <p class="subtitle">Sistema de Pontos</p>

      <form id="loginForm">
        <div class="input-group">
          <input type="email" id="email" placeholder="Email" required autocomplete="email">
          <div class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 6L12 13L2 6"/>
            </svg>
          </div>
        </div>

        <div class="input-group">
          <input type="password" id="password" placeholder="Senha" required autocomplete="current-password">
          <div class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
        </div>

        <button type="submit" class="btn-primary">
          <span>Entrar</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12H19M12 5L19 12L12 19"/>
          </svg>
        </button>

        <p class="link-text">
          Não tem conta? <a href="#" id="showRegister">Cadastre-se</a>
        </p>
      </form>
    </div>
  `;
  
  document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderRegisterForm();
  });
  
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const submitBtn = (e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLButtonElement;
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
      const response = await window.electronAPI.login({ 
        email: emailInput.value, 
        password: passwordInput.value 
      });
      
      if (response.success && response.user) {
        currentUser = response.user;
        if (response.user.isAdmin) {
          renderAdminPanel();
        } else {
          renderDashboard();
        }
      } else {
        showError(response.message || 'Erro ao fazer login');
      }
    } catch (error) {
      showError('Erro ao conectar com o servidor');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Mínimo 8 caracteres';
  if (!/[a-z]/.test(password)) return 'Precisa de letra minúscula';
  if (!/[A-Z]/.test(password)) return 'Precisa de letra maiúscula';
  if (!/[0-9]/.test(password)) return 'Precisa de número';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Precisa de caractere especial (!@#$%...)';
  return null;
}

function renderRegisterForm() {
  currentView = 'register';
  container.innerHTML = `
    <div class="auth-container">
      <div class="logo">
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#10A37F" stroke-width="3"/>
          <path d="M14 24C14 18.477 18.477 14 24 14V34C18.477 34 14 29.523 14 24Z" fill="#10A37F"/>
          <circle cx="24" cy="24" r="6" fill="#171717"/>
        </svg>
      </div>
      
      <h1>Criar Conta</h1>
      <p class="subtitle">Cadastre-se para começar</p>

      <form id="registerForm">
        <div class="input-group">
          <input type="text" id="name" placeholder="Nome" required autocomplete="name">
          <div class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20C4 17 8 14 12 14C16 14 20 17 20 20"/>
            </svg>
          </div>
        </div>

        <div class="input-group">
          <input type="email" id="email" placeholder="Email" required autocomplete="email">
          <div class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 6L12 13L2 6"/>
            </svg>
          </div>
        </div>

        <div class="input-group">
          <input type="password" id="password" placeholder="Senha" required autocomplete="new-password">
          <div class="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
        </div>
        
        <div class="password-requirements" id="passwordReq">
          <div class="req" data-req="length">8+ caracteres</div>
          <div class="req" data-req="lower">Letra minúscula</div>
          <div class="req" data-req="upper">Letra maiúscula</div>
          <div class="req" data-req="number">Número</div>
          <div class="req" data-req="special">Especial (!@#$...)</div>
        </div>

        <button type="submit" class="btn-primary" id="registerBtn">
          <span>Cadastrar</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12H19M12 5L19 12L12 19"/>
          </svg>
        </button>

        <p class="link-text">
          Já tem conta? <a href="#" id="showLogin">Faça login</a>
        </p>
      </form>
    </div>
  `;
  
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const passwordReq = document.getElementById('passwordReq');
  
  passwordInput?.addEventListener('input', () => {
    const pwd = passwordInput.value;
    if (passwordReq) {
      passwordReq.querySelector('[data-req="length"]')?.classList.toggle('met', pwd.length >= 8);
      passwordReq.querySelector('[data-req="lower"]')?.classList.toggle('met', /[a-z]/.test(pwd));
      passwordReq.querySelector('[data-req="upper"]')?.classList.toggle('met', /[A-Z]/.test(pwd));
      passwordReq.querySelector('[data-req="number"]')?.classList.toggle('met', /[0-9]/.test(pwd));
      passwordReq.querySelector('[data-req="special"]')?.classList.toggle('met', /[!@#$%^&*(),.?":{}|<>]/.test(pwd));
    }
  });
  
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderLoginForm();
  });
  
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const submitBtn = document.getElementById('registerBtn') as HTMLButtonElement;
    
    const passwordError = validatePassword(passwordInput.value);
    if (passwordError) {
      showError(passwordError);
      return;
    }
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
      const response = await window.electronAPI.register({ 
        email: emailInput.value, 
        password: passwordInput.value,
        name: nameInput.value
      });
      
      if (response.success) {
        showSuccess('Conta criada! Faça login.');
        setTimeout(() => renderLoginForm(), 1500);
      } else {
        showError(response.message || 'Erro ao criar conta');
      }
    } catch (error) {
      showError('Erro ao conectar com o servidor');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}

function renderDashboard() {
  currentView = 'dashboard';
  container.innerHTML = `
    <div class="dashboard">
      <div class="user-header">
        <div class="user-info">
          <div class="avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#10A37F"/>
              <path d="M12 14C8.667 14 6 11.314 6 8C6 4.686 8.667 2 12 2C15.333 2 18 4.686 18 8C18 11.314 15.333 14 12 14Z" fill="#10A37F"/>
            </svg>
          </div>
          <div>
            <span class="user-name">${currentUser?.name}</span>
            <span class="user-email">${currentUser?.email}</span>
          </div>
        </div>
        <button class="btn-logout" id="logoutBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
      
      <nav class="nav-tabs">
        <button class="nav-tab active" data-section="wallet">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M22 10H2M6 14H6.01"/>
          </svg>
          <span>Carteira</span>
        </button>
        <button class="nav-tab" data-section="buy">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span>Comprar</span>
        </button>
        <button class="nav-tab" data-section="use">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
          <span>Usar Pontos</span>
        </button>
        <button class="nav-tab" data-section="profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20C4 17 8 14 12 14C16 14 20 17 20 20"/>
          </svg>
          <span>Perfil</span>
        </button>
      </nav>
      
      <div class="content-area" id="contentArea">
      </div>
    </div>
  `;
  
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const section = (e.currentTarget as HTMLElement).dataset.section as 'wallet' | 'buy' | 'use' | 'profile';
      currentSection = section;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      (e.currentTarget as HTMLElement).classList.add('active');
      renderSection(section);
    });
  });
  
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.electronAPI.logout();
    currentUser = null;
    renderLoginForm();
  });
  
  renderSection('wallet');
}

async function renderSection(section: 'wallet' | 'buy' | 'use' | 'profile') {
  const contentArea = document.getElementById('contentArea');
  if (!contentArea) return;
  
  switch (section) {
    case 'wallet':
      await renderWalletSection(contentArea);
      break;
    case 'buy':
      renderBuySection(contentArea);
      break;
    case 'use':
      renderUseSection(contentArea);
      break;
    case 'profile':
      renderProfileSection(contentArea);
      break;
  }
}

async function renderWalletSection(container: HTMLElement) {
  const balanceResult = await window.electronAPI.getBalance();
  const balance = balanceResult.success ? balanceResult.balance : 0;
  const leaderboardResult = await window.electronAPI.getLeaderboard();
  const leaderboard = leaderboardResult.success ? leaderboardResult.leaderboard : [];
  
  container.innerHTML = `
    <div class="section wallet-section">
      <div class="balance-card">
        <div class="balance-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4"/>
          </svg>
        </div>
        <div class="balance-info">
          <span class="balance-label">Saldo Atual</span>
          <span class="balance-value">${balance} <small>pontos</small></span>
        </div>
      </div>
      
      <div class="quick-actions">
        <button class="quick-btn" onclick="document.querySelector('[data-section=buy]').click()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>Comprar Pontos</span>
        </button>
        <button class="quick-btn" onclick="document.querySelector('[data-section=use]').click()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14"/>
          </svg>
          <span>Usar Pontos</span>
        </button>
      </div>
      
      <div class="leaderboard-mini">
        <h3>Ranking Top 5</h3>
        <div class="leaderboard-list">
          ${leaderboard.slice(0, 5).map((user, index) => `
            <div class="leaderboard-item ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">
              <span class="rank">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</span>
              <span class="name">${user.name}</span>
              <span class="points">${user.points}</span>
            </div>
          `).join('')}
          ${leaderboard.length === 0 ? '<p class="no-data">Nenhum usuário ainda</p>' : ''}
        </div>
      </div>
    </div>
  `;
}

function renderBuySection(container: HTMLElement) {
  const amounts = [100, 500, 1000, 5000, 10000];
  
  container.innerHTML = `
    <div class="section buy-section">
      <h2>Comprar Pontos</h2>
      <p class="section-desc">Selecione a quantidade de pontos que deseja adicionar à sua carteira.</p>
      
      <div class="amount-grid">
        ${amounts.map(amount => `
          <button class="amount-card" data-amount="${amount}">
            <span class="amount-value">${amount.toLocaleString()}</span>
            <span class="amount-label">pontos</span>
          </button>
        `).join('')}
      </div>
      
      <div class="custom-amount">
        <label>Quantidade personalizada:</label>
        <div class="input-group">
          <input type="number" id="customAmount" placeholder="Digite a quantidade" min="1">
        </div>
      </div>
      
      <button class="btn-primary btn-buy" id="buyBtn">
        <span>Confirmar Compra</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12H19M12 5L19 12L12 19"/>
        </svg>
      </button>
    </div>
  `;
  
  let selectedAmount: number | null = null;
  
  document.querySelectorAll('.amount-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.amount-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedAmount = parseInt((card as HTMLElement).dataset.amount || '0');
      (document.getElementById('customAmount') as HTMLInputElement).value = '';
    });
  });
  
  document.getElementById('customAmount')?.addEventListener('input', () => {
    document.querySelectorAll('.amount-card').forEach(c => c.classList.remove('selected'));
    selectedAmount = null;
  });
  
  document.getElementById('buyBtn')?.addEventListener('click', async () => {
    const customAmountInput = document.getElementById('customAmount') as HTMLInputElement;
    const amount = selectedAmount || parseInt(customAmountInput.value);
    
    if (!amount || amount <= 0) {
      showError('Selecione ou digite uma quantidade válida');
      return;
    }
    
    const btn = document.getElementById('buyBtn') as HTMLButtonElement;
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
      const result = await window.electronAPI.addPoints(amount);
      if (result.success) {
        showSuccess(`${amount} pontos adicionados!`);
        setTimeout(() => {
          currentSection = 'wallet';
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          document.querySelector('[data-section="wallet"]')?.classList.add('active');
          renderSection('wallet');
        }, 1500);
      } else {
        showError(result.message || 'Erro ao adicionar pontos');
      }
    } catch (error) {
      showError('Erro ao conectar com o servidor');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

function renderUseSection(container: HTMLElement) {
  container.innerHTML = `
    <div class="section use-section">
      <h2>Usar Pontos</h2>
      <p class="section-desc">Gaste seus pontos em serviços e funcionalidades exclusivas.</p>
      
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h4>API Premium</h4>
          <p>100 pontos</p>
          <span class="service-desc">Acesso ilimitado à API</span>
        </div>
        
        <div class="service-card">
          <div class="service-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
            </svg>
          </div>
          <h4>Badge Especial</h4>
          <p>50 pontos</p>
          <span class="service-desc">Visual diferenciado no app</span>
        </div>
        
        <div class="service-card">
          <div class="service-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h4>Resposta Rápida</h4>
          <p>200 pontos</p>
          <span class="service-desc">Respostas mais rápidas</span>
        </div>
        
        <div class="service-card">
          <div class="service-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </div>
          <h4>Exportar Dados</h4>
          <p>30 pontos</p>
          <span class="service-desc">Download do histórico</span>
        </div>
      </div>
      
      <div class="use-custom">
        <label>Usar quantidade personalizada:</label>
        <div class="input-group">
          <input type="number" id="useAmount" placeholder="Quantidade de pontos">
        </div>
        <button class="btn-secondary" id="useCustomBtn">Usar Pontos</button>
      </div>
    </div>
  `;
  
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', async () => {
      const text = card.querySelector('p')?.textContent || '';
      const match = text.match(/(\d+)/);
      if (!match) return;
      
      const points = parseInt(match[1]);
      
      const btn = document.getElementById('useCustomBtn') as HTMLButtonElement;
      btn.classList.add('loading');
      
      try {
        const result = await window.electronAPI.removePoints(points);
        if (result.success) {
          showSuccess(`${points} pontos usados!`);
          setTimeout(() => {
            currentSection = 'wallet';
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-section="wallet"]')?.classList.add('active');
            renderSection('wallet');
          }, 1500);
        } else {
          showError(result.message || 'Pontos insuficientes');
        }
      } catch (error) {
        showError('Erro ao usar pontos');
      } finally {
        btn.classList.remove('loading');
      }
    });
  });
  
  document.getElementById('useCustomBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('useAmount') as HTMLInputElement;
    const amount = parseInt(input.value);
    
    if (!amount || amount <= 0) {
      showError('Digite uma quantidade válida');
      return;
    }
    
    const btn = document.getElementById('useCustomBtn') as HTMLButtonElement;
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
      const result = await window.electronAPI.removePoints(amount);
      if (result.success) {
        showSuccess(`${amount} pontos usados!`);
        input.value = '';
        setTimeout(() => {
          currentSection = 'wallet';
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          document.querySelector('[data-section="wallet"]')?.classList.add('active');
          renderSection('wallet');
        }, 1500);
      } else {
        showError(result.message || 'Pontos insuficientes');
      }
    } catch (error) {
      showError('Erro ao usar pontos');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

function renderProfileSection(container: HTMLElement) {
  container.innerHTML = `
    <div class="section profile-section">
      <div class="profile-header">
        <div class="profile-avatar">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#10A37F"/>
            <path d="M12 14C8.667 14 6 11.314 6 8C6 4.686 8.667 2 12 2C15.333 2 18 4.686 18 8C18 11.314 15.333 14 12 14Z" fill="#10A37F"/>
          </svg>
        </div>
        <h2>${currentUser?.name}</h2>
      </div>
      
      <div class="profile-info">
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${currentUser?.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">ID do Usuário</span>
          <span class="info-value id-value">${currentUser?.userId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Membro desde</span>
          <span class="info-value">${new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      
      <div class="profile-stats">
        <div class="stat-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4"/>
          </svg>
          <span class="stat-value" id="statBalance">...</span>
          <span class="stat-label">Pontos</span>
        </div>
        <div class="stat-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span class="stat-value" id="statRank">...</span>
          <span class="stat-label">Ranking</span>
        </div>
      </div>
      
      <div class="profile-actions">
        <button class="btn-secondary" onclick="document.querySelector('[data-section=wallet]').click()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M22 10H2M6 14H6.01"/>
          </svg>
          Ver Carteira
        </button>
      </div>
    </div>
  `;
  
  (async () => {
    const balanceResult = await window.electronAPI.getBalance();
    if (balanceResult.success) {
      const statBalance = document.getElementById('statBalance');
      if (statBalance) statBalance.textContent = String(balanceResult.balance);
    }
    
    const leaderboardResult = await window.electronAPI.getLeaderboard();
    if (leaderboardResult.success) {
      const rank = leaderboardResult.leaderboard?.findIndex(u => u.name === currentUser?.name) ?? -1;
      const statRank = document.getElementById('statRank');
      if (statRank) statRank.textContent = rank >= 0 ? '#' + (rank + 1) : '-';
    }
  })();
}

async function checkSession() {
  const session = await window.electronAPI.getSession();
  if (session.authenticated && session.user) {
    currentUser = session.user;
    if (session.user.isAdmin) {
      renderAdminPanel();
    } else {
      renderDashboard();
    }
  } else {
    renderLoginForm();
  }
}

function renderAdminPanel() {
  currentView = 'admin';
  container.innerHTML = `
    <div class="dashboard admin-dashboard">
      <div class="user-header admin-header">
        <div class="user-info">
          <div class="avatar admin-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <div>
            <span class="user-name">Painel Admin</span>
            <span class="user-email">${currentUser?.email}</span>
          </div>
        </div>
        <button class="btn-logout" id="logoutBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
      
      <nav class="nav-tabs">
        <button class="nav-tab active" data-section="stats">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
          <span>Estatísticas</span>
        </button>
        <button class="nav-tab" data-section="users">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Usuários</span>
        </button>
      </nav>
      
      <div class="content-area" id="contentArea"></div>
    </div>
  `;
  
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const section = (e.currentTarget as HTMLElement).dataset.section as 'stats' | 'users';
      currentSection = section;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      (e.currentTarget as HTMLElement).classList.add('active');
      renderAdminSection(section);
    });
  });
  
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.electronAPI.logout();
    currentUser = null;
    renderLoginForm();
  });
  
  renderAdminSection('stats');
}

async function renderAdminSection(section: 'stats' | 'users') {
  const contentArea = document.getElementById('contentArea');
  if (!contentArea) return;
  
  if (section === 'stats') {
    await renderAdminStats(contentArea);
  } else {
    await renderAdminUsers(contentArea);
  }
}

async function renderAdminStats(container: HTMLElement) {
  container.innerHTML = `<div class="section"><div class="loading-admin">Carregando...</div></div>`;
  
  const result = await window.electronAPI.getAdminStats();
  
  if (result.success && result.stats) {
    container.innerHTML = `
      <div class="section admin-stats">
        <h2>Estatísticas do Sistema</h2>
        
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">${result.stats.totalUsers}</span>
              <span class="stat-label">Total de Usuários</span>
            </div>
          </div>
          
          <div class="stat-box">
            <div class="stat-icon accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">${result.stats.totalPoints.toLocaleString()}</span>
              <span class="stat-label">Total de Pontos</span>
            </div>
          </div>
        </div>
        
        ${result.stats.topUser ? `
        <div class="top-user-card">
          <h3>🏆 Top Usuário</h3>
          <div class="top-user-info">
            <span class="top-name">${result.stats.topUser.name}</span>
            <span class="top-points">${result.stats.topUser.points.toLocaleString()} pontos</span>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  } else {
    container.innerHTML = `<div class="section"><p class="error-message">Erro ao carregar estatísticas</p></div>`;
  }
}

async function renderAdminUsers(container: HTMLElement) {
  container.innerHTML = `<div class="section"><div class="loading-admin">Carregando...</div></div>`;
  
  const result = await window.electronAPI.getAdminUsers();
  
  if (result.success && result.users) {
    container.innerHTML = `
      <div class="section admin-users">
        <h2>Gerenciar Usuários</h2>
        <p class="section-desc">Adicione, remova pontos ou exclua usuários.</p>
        
        <div class="users-list">
          ${result.users.map(user => `
            <div class="user-card" id="user-${user.id}">
              <div class="user-info-mini">
                <div class="user-avatar-small">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="#10A37F"/>
                    <path d="M12 14C8.667 14 6 11.314 6 8C6 4.686 8.667 2 12 2C15.333 2 18 4.686 18 8C18 11.314 15.333 14 12 14Z" fill="#10A37F"/>
                  </svg>
                </div>
                <div class="user-details">
                  <span class="user-name-mini">${user.name}</span>
                  <span class="user-email-mini">${user.email}</span>
                </div>
              </div>
              <div class="user-points">${user.points.toLocaleString()} pts</div>
              <div class="user-actions">
                <input type="number" class="points-input" placeholder="Qtd" min="1">
                <button class="btn-add-points" onclick="adminAddPoints('${user.id}')">+</button>
                <button class="btn-remove-points" onclick="adminRemovePoints('${user.id}')">-</button>
                <button class="btn-delete-user" onclick="confirmDeleteUser('${user.id}', '${user.name}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `<div class="section"><p class="error-message">Erro ao carregar usuários</p></div>`;
  }
}

(window as any).adminAddPoints = async function(userId: string) {
  const card = document.getElementById(`user-${userId}`);
  const input = card?.querySelector('.points-input') as HTMLInputElement;
  const amount = parseInt(input?.value || '0');
  
  if (!amount || amount <= 0) {
    showError('Digite uma quantidade válida');
    return;
  }
  
  const result = await window.electronAPI.adminAddPoints(userId, amount);
  if (result.success) {
    showSuccess(`${amount} pontos adicionados!`);
    input.value = '';
    renderAdminSection('users');
  } else {
    showError(result.message || 'Erro');
  }
};

(window as any).adminRemovePoints = async function(userId: string) {
  const card = document.getElementById(`user-${userId}`);
  const input = card?.querySelector('.points-input') as HTMLInputElement;
  const amount = parseInt(input?.value || '0');
  
  if (!amount || amount <= 0) {
    showError('Digite uma quantidade válida');
    return;
  }
  
  const result = await window.electronAPI.adminRemovePoints(userId, amount);
  if (result.success) {
    showSuccess(`${amount} pontos removidos!`);
    input.value = '';
    renderAdminSection('users');
  } else {
    showError(result.message || 'Erro');
  }
};

(window as any).confirmDeleteUser = async function(userId: string, userName: string) {
  if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?\nEsta ação não pode ser desfeita.`)) {
    const result = await window.electronAPI.deleteUser(userId);
    if (result.success) {
      showSuccess(`Usuário "${userName}" excluído!`);
      renderAdminSection('users');
    } else {
      showError(result.message || 'Erro ao excluir usuário');
    }
  }
};

checkSession();
