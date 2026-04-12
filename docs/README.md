# Lufus Project - Documentação Completa

## Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura](#-arquitetura)
3. [CQRS e Event Sourcing](#-cqrs-e-event-sourcing)
4. [Quick Start](#-quick-start)
5. [Comandos CLI](#-comandos-cli)
6. [Configuração](#-configuração)
7. [Segurança](#-segurança)
8. [Desenvolvimento](#-desenvolvimento)

---

## Visão Geral

Lufus é um sistema de gerenciamento de usuários e carteiras de pontos com:

- **TypeScript** + **Bun**
- **PostgreSQL** + **Drizzle ORM**
- **CQRS** (Command Query Responsibility Segregation)
- **Event Sourcing** (armazenamento de eventos)
- **Docker** + **Docker Compose**
- **DDD** + **Clean Architecture**

### Funcionalidades

- Cadastro e login de usuários
- Carteira de pontos por usuário
- Adicionar/remover/transferir pontos
- Histórico completo de transações
- Ranking de usuários
- Sessões persistidas

---

## Arquitetura

### Clean Architecture + DDD + CQRS

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION                             │
│                    CLI (Admin + Cliente)                     │
├─────────────────────────────────────────────────────────────┤
│              APPLICATION LAYER                               │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │     COMMANDS        │  │      QUERIES        │          │
│  │  (writes)           │  │  (reads)            │          │
│  │  CreateUser         │  │  GetUser            │          │
│  │  AddPoints          │  │  ListUsers          │          │
│  │  RemovePoints       │  │  GetBalance         │          │
│  │  TransferPoints     │  │  GetHistory         │          │
│  │  DeleteUser         │  │  GetLeaderboard     │          │
│  └─────────────────────┘  └─────────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                       DOMAIN                                 │
│  Entities    │  Value Objects  │  Events     │  Interfaces│
│  User        │  ID             │  UserCreated│  IUserRepo │
│  Wallet      │  Email          │  PointsAdded│  IWalletRep │
│              │  Password       │  PointsRemv │             │
│              │  Points         │  Transferred│             │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                            │
│  Repositories  │  Event Store  │  Cryptography             │
│  DrizzleUser   │  PostgreSQL    │  Argon2Id                 │
│  DrizzleWallet │  (append-only) │  UUID Gen                 │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
ESCRITA (Commands):
CLI → Command → Validate → UseCase → Repository → PostgreSQL
                                            ↓
                                    EventStore (append)

LEITURA (Queries):
CLI → Query → ReadModel → Projection → Result
```

---

## CQRS e Event Sourcing

### O que é CQRS?

**Command Query Responsibility Segregation** - Separação de responsabilidade entre escrita e leitura.

```
TRADICIONAL (mesmo código para ler e escrever):
┌─────────────────────────────────────┐
│  UserRepository                      │
│  create(user) → ESCRITA             │
│  findById(id)  → LEITURA           │
└─────────────────────────────────────┘

CQRS (código separado):
┌──────────────────┐  ┌──────────────────┐
│  COMMANDS        │  │  QUERIES         │
│  CreateUser      │  │  GetUser         │
│  AddPoints       │  │  ListUsers       │
│  RemovePoints    │  │  GetBalance      │
└──────────────────┘  └──────────────────┘
```

### O que é Event Sourcing?

Armazenar **todos os eventos** que acontecem no sistema, não apenas o estado atual.

```
ESTADO TRADICIONAL:
┌─────────────────────────────────┐
│  Wallet                          │
│  points: 500  ← Só o valor atual │
└─────────────────────────────────┘

EVENT SOURCING:
┌─────────────────────────────────┐
│  Events                          │
│  1. UserCreated(user1)          │
│  2. PointsAdded(user1, +100)    │
│  3. PointsAdded(user1, +200)    │
│  4. PointsRemoved(user1, -50)   │
│  5. PointsAdded(user1, +250)    │
│                                 │
│  SALDO = replay(events)         │
│  100 + 200 - 50 + 250 = 500    │
└─────────────────────────────────┘
```

### Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **Audit Trail** | Histórico completo de todas operações |
| **Replay** | Recriar estado em qualquer momento |
| **Debugging** | Saber exatamente o que aconteceu |
| **Tendências** | Analisar padrões de uso |
| **Consistência** | Eventos são imutáveis |
| **Escalabilidade** | Reads e writes independentes |

### Tabela de Eventos

```sql
CREATE TABLE events (
    id              UUID PRIMARY KEY,
    aggregate_id   UUID NOT NULL,      -- ID do usuário
    event_type     VARCHAR(255),       -- PointsAdded, PointsRemoved, etc.
    event_data     JSONB,             -- Dados do evento
    occurred_at    TIMESTAMPTZ,        -- Quando aconteceu
    version        INTEGER             -- Versão do evento
);
```

### Eventos Implementados

| Evento | Descrição |
|--------|-----------|
| `UserCreated` | Novo usuário cadastrado |
| `PointsAdded` | Pontos adicionados |
| `PointsRemoved` | Pontos removidos |
| `PointsTransferred` | Transferência entre usuários |
| `UserDeleted` | Usuário deletado |

---

## Quick Start

### Pré-requisitos
- Docker + Docker Compose
- Bun (opcional)

### 1. Configurar ambiente

```bash
# Clonar repositório
git clone <repo-url>
cd lufus_project

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env
nano .env
```

### 2. Subir serviços

```bash
docker compose up -d postgres
bun run db:push
```

### 3. Usar CLIs

```bash
# CLI de administração
bun run cli

# CLI de usuário (com login)
bun run client
```

---

## Comandos CLI

### CLI de Administração

```bash
bun run cli <comando>
```

| Comando | Descrição |
|---------|-----------|
| `create-user <email> <password> <name>` | Criar usuário |
| `list-users` | Listar todos usuários |
| `get-user <id>` | Ver detalhes do usuário |
| `add-points <id> <quantidade>` | Adicionar pontos |
| `remove-points <id> <quantidade>` | Remover pontos |
| `delete-user <id>` | Deletar usuário |
| `delete-all-users` | Deletar todos |

### CLI de Cliente

```bash
bun run client
```

Menu interativo:
- 🔑 Login / Cadastro
- 💰 Adicionar pontos
- 🎫 Usar pontos
- 🔄 Transferir pontos
- 📜 Histórico de transações
- 🏆 Ranking
- 👤 Ver perfil
- 🚪 Logout

---

## Configuração

### Variáveis de Ambiente

```bash
# ============================================
# DATABASE
# ============================================
POSTGRES_USER=lufus
POSTGRES_PASSWORD=sua_senha_forte
POSTGRES_DB=lufus
DATABASE_URL=postgresql://lufus:senha@localhost:5432/lufus

# ============================================
# SECURITY (OBRIGATÓRIO)
# ============================================
PASSWORD_PEPPER=$(openssl rand -hex 32)

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production  # ou development
LOG_LEVEL=INFO
```

### Gerar Secrets

```bash
# PASSWORD_PEPPER (32 bytes hex)
openssl rand -hex 32

# API Key (64 bytes hex)
openssl rand -hex 64

# Senha do banco (24 bytes base64)
openssl rand -base64 24
```

---

## Segurança

Consulte [docs/SECURITY.md](SECURITY.md) para informações completas.

### Resumo

- **Senhas**: Argon2id + pepper
- **Banco**: SCRAM-SHA-256 + SSL
- **Rate Limit**: 100 req/min
- **Input**: Validação com regex
- **Eventos**: Imutáveis (append-only)

---

## Desenvolvimento

### Estrutura de Pastas

```
src/
├── application/
│   ├── commands/           # COMMANDS (writes)
│   ├── queries/            # QUERIES (reads)
│   └── use-cases/          # Use cases originais
├── domain/
│   ├── entities/           # User, Wallet
│   ├── value-objects/       # ID, Email, Password, Points
│   └── events/             # Domain events
├── infrastructure/
│   ├── persistence/         # Repos Drizzle
│   ├── event-store/         # EventStore
│   └── cryptography/        # Argon2Id
├── shared/
│   ├── security/           # RateLimiter, SessionManager
│   └── logger/              # Logger
├── cli.ts                   # CLI admin
└── client.ts                # CLI cliente
```

### Comandos Úteis

```bash
# Desenvolvimento
bun run dev          # CLI admin
bun run client       # CLI cliente

# Banco
bun run db:push      # Aplicar schema
bun run db:generate  # Gerar migrations

# Testes
bun test             # Rodar testes
```

### Adicionar Novo Command

```typescript
// src/application/commands/NovoCommand.ts
export class NovoCommand {
    async execute(input: InputType): Promise<CommandResult> {
        // Validação
        // Lógica de negócio
        // Salvar evento
        await eventStore.append(new NovoEvento(...));
        return { success: true };
    }
}
```

### Adicionar Nova Query

```typescript
// src/application/queries/NovaQuery.ts
export class NovaQuery {
    async execute(param: string): Promise<Resultado> {
        // Buscar dados otimizados para leitura
        return resultado;
    }
}
```

---

## Referência Rápida

### Entidades

| Entidade | Descrição |
|----------|-----------|
| `User` | Usuário com email, senha, nome |
| `Wallet` | Carteira com userId e pontos |

### Value Objects

| VO | Validação |
|----|-----------|
| `ID` | UUID formato |
| `Email` | Formato válido |
| `Password` | 8+ chars, maiúsc, minúsc, número, símbolo |
| `Points` | Inteiro 0-1.000.000 |

---

**Versão:** 1.0.0  
**Última atualização:** 11-04-2026
