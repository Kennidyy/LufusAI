# 📋 Arquivos de Desenvolvimento

Este documento lista arquivos e diretórios que **NÃO** devem ser commitados para produção.

## ⚠️ NUNCA COMMITAR

### 🔐 Secrets e Configurações

| Arquivo | Descrição |
|---------|-----------|
| `.env` | Variáveis de ambiente com secrets |
| `.env.local` | Configurações locais |
| `.env.production` | Configurações de produção |
| `drizzle.config.json` | Contém credenciais do banco |

### 🔑 Tokens e Sessões

| Arquivo | Descrição |
|---------|-----------|
| `.lufus-session` | Arquivo de sessão do CLI |
| `*.session` | Qualquer arquivo de sessão |

### 📁 Diretórios Gerados

| Diretório | Descrição |
|-----------|-----------|
| `node_modules/` | Dependências npm |
| `coverage/` | Relatórios de coverage |
| `dist/` | Código compilado |
| `out/` | Build output |
| `logs/` | Arquivos de log |
| `.cache/` | Cache do Bun/Eslint |

### 🖥️ IDE e OS

| Arquivo | Descrição |
|---------|-----------|
| `.idea/` | WebStorm/IntelliJ |
| `.vscode/` | VS Code settings |
| `*.swp`, `*.swo` | Vim swap files |
| `.DS_Store` | macOS |
| `Thumbs.db` | Windows |

---

## ✅ DEVE SER COMMITADO

### Template de Configuração

```bash
.env.example   # Template com todas as variáveis (sem valores reais)
```

### Código Fonte

```bash
src/           # Código TypeScript
tests/         # Testes unitários
database/      # Schema e migrations
docs/          # Documentação
```

### Docker e Build

```bash
docker-compose.yml
Dockerfile
.dockerignore
drizzle.config.ts
tsconfig.json
```

### Documentação

```bash
README.md
docs/
  README.md
  SECURITY.md
  DEVELOP.md
```

---

## 📝 Como Configurar

### 1. Copiar variáveis de ambiente

```bash
cp .env.example .env
```

### 2. Editar `.env` com valores reais

```bash
nano .env
```

### 3. Gerar secrets seguros

```bash
# Gerar PASSWORD_PEPPER
openssl rand -hex 32

# Gerar senha do banco
openssl rand -base64 24
```

---

## 🔍 Verificar Antes de Commit

```bash
# Verificar status do git
git status

# Verificar arquivos que serão commitados
git diff --cached --name-only

# Verificar secrets no staging
git diff --staged --name-only | xargs grep -l "PASSWORD\|SECRET\|KEY" 2>/dev/null
```

---

## 🛡️ Pre-commit Hook (Opcional)

Para prevenir commits acidentais de secrets, adicione ao `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Verificar .env
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "❌ ERRO: .env não pode ser commitado!"
    echo "   Use .env.example como template."
    exit 1
fi

# Verificar .lufus-session
if git diff --cached --name-only | grep -q "\.lufus-session"; then
    echo "❌ ERRO: Arquivo de sessão não pode ser commitado!"
    exit 1
fi

exit 0
```

```bash
chmod +x .git/hooks/pre-commit
```
