# Lufus Project

Sistema de gerenciamento de usuários e pontos com **CQRS** e **Event Sourcing**.

---

## Quick Start

```bash
# 1. Instalar dependências
bun install

# 2. Configurar ambiente
cp .env.example .env

# 3. Subir banco
docker compose up -d postgres
bun run db:push

# 4. Rodar CLIs
bun run cli      # CLI admin
bun run client   # CLI cliente
```

---

## Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | Bun |
| Banco | PostgreSQL + Drizzle ORM |
| Arquitetura | DDD + Clean Architecture + CQRS |
| Segurança | Argon2id + Event Sourcing |

---

## Arquitetura

```
┌────────────────────────────────────────────┐
│  CLI (Admin + Cliente)                     │
├────────────────────────────────────────────┤
│  COMMANDS (writes)  │  QUERIES (reads)    │
│  CreateUser         │  GetUser            │
│  AddPoints         │  ListUsers          │
│  RemovePoints      │  GetBalance         │
│  TransferPoints    │  GetHistory         │
├────────────────────────────────────────────┤
│  Domain: Entities, Value Objects, Events    │
│  Infrastructure: PostgreSQL, Event Store   │
└────────────────────────────────────────────┘
```

---

## Funcionalidades

- Cadastro e login de usuários
- Carteira de pontos por usuário
- Adicionar/remover/transferir pontos
- Histórico completo de transações
- Ranking de usuários
- Sessões persistidas (7 dias)

---

## Comandos

### CLI Admin
```bash
bun run cli create-user <email> <password> <name>
bun run cli list-users
bun run cli add-points <id> <qtd>
bun run cli remove-points <id> <qtd>
```

### CLI Cliente
```bash
bun run client
# Menu interativo com login
```

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [docs/README.md](docs/README.md) | Documentação completa |
| [docs/SECURITY.md](docs/SECURITY.md) | Práticas de segurança |
| [docs/DEVELOP.md](docs/DEVELOP.md) | Guia de desenvolvimento |

---

## Testes

```bash
bun test  # 156 testes passando
```

---

## Estrutura

```
src/
├── application/
│   ├── commands/        # CQRS Commands
│   ├── queries/         # CQRS Queries
│   └── use-cases/       # Use cases originais
├── domain/
│   ├── entities/        # User, Wallet
│   ├── value-objects/   # ID, Email, Points
│   └── events/          # Domain events
├── infrastructure/
│   ├── persistence/     # Drizzle repositories
│   ├── event-store/     # Event store
│   └── cryptography/     # Argon2Id
└── shared/
    ├── security/        # Rate limiter, sessions
    └── logger/          # Logging
```

---

## Configuração

```bash
# Variáveis obrigatórias em .env
POSTGRES_PASSWORD=sua_senha
PASSWORD_PEPPER=$(openssl rand -hex 32)
DATABASE_URL=postgresql://...
```

---

**Versão:** 1.0.0 | **Última atualização:** 11-04-2026
