declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>;
      close: () => Promise<void>;
      login: (data: { email: string; password: string }) => Promise<{ success: boolean; message: string; user?: { id: string; email: string; name: string } }>;
      getSession: () => Promise<{ authenticated: boolean; user?: { userId: string; email: string; name: string } }>;
      logout: () => Promise<{ success: boolean }>;
    };
  }
}

const form = document.getElementById('loginForm') as HTMLFormElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
const loginContainer = document.querySelector('.login-container') as HTMLElement;

document.getElementById('minimizeBtn')?.addEventListener('click', () => {
  window.electronAPI.minimize();
});

document.getElementById('closeBtn')?.addEventListener('click', async () => {
  await window.electronAPI.logout();
  window.electronAPI.close();
});

async function checkSession() {
  const session = await window.electronAPI.getSession();
  if (session.authenticated && session.user) {
    showDashboard(session.user.name, session.user.email);
  }
}

function showDashboard(name: string, email: string) {
  loginContainer.innerHTML = `
    <div class="dashboard">
      <div class="user-info">
        <div class="avatar">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#10A37F"/>
            <path d="M12 14C8.667 14 6 11.314 6 8C6 4.686 8.667 2 12 2C15.333 2 18 4.686 18 8C18 11.314 15.333 14 12 14Z" fill="#10A37F"/>
          </svg>
        </div>
        <h2>${name}</h2>
        <p>${email}</p>
      </div>
      <button class="logout-btn" id="logoutBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        <span>Sair</span>
      </button>
    </div>
  `;
  
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.electronAPI.logout();
    location.reload();
  });
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) return;

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const response = await window.electronAPI.login({ email, password });
    
    if (response.success && response.user) {
      showDashboard(response.user.name, response.user.email);
    } else {
      showError(response.message);
    }
  } catch (error) {
    showError('Erro ao conectar com o servidor');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});

function showError(message: string) {
  const existingError = document.querySelector('.error-message');
  existingError?.remove();

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  form?.prepend(errorDiv);

  setTimeout(() => errorDiv.remove(), 4000);
}

checkSession();