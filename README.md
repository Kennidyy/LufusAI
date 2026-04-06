# Lufus Project
---

## Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | [Bun](https://bun.sh) v1.3.10+ |
| Linguagem | TypeScript (strict mode) |
| Validação | `validator` (emails RFC-compliant) |
| Hashing | Argon2id (via `Bun.password.hash`) |
| Testes | Bun's built-in test runner |
| IDs | UUIDv7 (`Bun.randomUUIDv7()`) |

---

## Arquitetura

```
src/
├── application/          # Casos de Uso
│   └── use-cases/
│       ├── CreateUserUseCase.ts
│       ├── AddPointsUseCase.ts
│       └── RemovePointsUseCase.ts
│
├── domain/               # Regras de Negócio
│   ├── entities/         # User, Wallet
│   ├── repositories/     # Interfaces (contratos)
│   └── value-objects/   # Email, Name, Password, Points, ID
│
├── infrastructure/       # Detalhes Técnicos
│   ├── cryptography/     # Argon2IdPasswordHash
│   ├── persistence/      # JsonUserRepository, JsonWalletRepository
│   ├── uuid/            # UuidGenerator
│   └── validators/       # EmailValidator
│
└── cli.ts               # Interface CLI
```

### Camadas

| Camada | Responsabilidade |
|--------|------------------|
| **Domain** | Entidades, value objects, regras de negócio. Não tem dependências externas. |
| **Application** | Casos de uso que orquestram a lógica. Depende apenas do domain. |
| **Infrastructure** | Implementações concretas (persistência, validação, criptografia). |

---

## Funcionalidades

### Gestão de Usuários
- Cadastro com email, senha e nome
- Validação rigorosa de emails (padrão RFC)
- Requisitos de senha:
  - 8-128 caracteres
  - Pelo menos: minúscula, maiúscula, número e caractere especial
  - Máximo 50% caracteres repetidos
- Hashing com Argon2id + pepper (armazenado em `.env`)

### Carteira de Pontos
- Saldo de pontos por usuário
- Operações: adicionar e remover pontos
- Regras: sem pontos negativos, apenas inteiros

---

## Começando

### Pré-requisitos
- Bun 1.3.10 ou superior

### Instalação

```bash
bun install
```

### Configuração

Crie o arquivo `api/.env` com a variável:

```env
PASSWORD_PEPPER=sua_chave_secreta_aqui
```

### Comandos CLI

```bash
# Criar usuário
bun run cli create-user <email> <password> <name>
bun run cli nikollas@example.com "Password1@" "Nikollas"

# Gerenciar pontos
bun run cli add-points <userId> <amount>
bun run cli remove-points <userId> <amount>
bun run cli get-balance <userId>

# Consultas
bun run cli get-user <userId>
bun run cli list-users
```

### Executar Testes

```bash
bun test
```

---

## Testes

11 arquivos de teste cobrindo toda a camada de domínio e casos de uso:

| Arquivo | Cobertura |
|---------|-----------|
| `CreateUserUseCase.test.ts` | Caso de uso de criação |
| `Email.test.ts` | Value object Email |
| `EmailValidator.test.ts` | Validador de email |
| `ID.test.ts` | Value object ID |
| `Name.test.ts` | Value object Name |
| `Password.test.ts` | Value object Password |
| `Points.test.ts` | Value object Points |
| `User.test.ts` | Entidade User |
| `UuidGenerator.test.ts` | Gerador de UUID |
| `Wallet.test.ts` | Repositório Wallet |
| `WalletEntity.test.ts` | Entidade Wallet |

---

## Estrutura de Dados

### users.json
```json
{
  "id": "uuid-v7",
  "email": "usuario@exemplo.com",
  "password": "hash_argon2id",
  "name": "Nome Completo",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### wallets.json
```json
{
  "id": "uuid-v7",
  "userId": "uuid-v7",
  "points": 100,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

---

## Boas Práticas

- **Value Objects** são imutáveis (construtor privado, factory methods)
- **Entidades** controlam suas próprias invariantes
- **Repositórios** são interfaces no domain, implementadas na infrastructure
- **Testes** usam mocks para dependências externas
- **TypeScript strict mode** habilitado

---

## Contribuição

1. Foldegers devem respeitar a arquitetura de camadas
2. Novas regras de negócio vão para `domain`
3. Casos de uso novos vão para `application/use-cases`
4. Implementações concretas vão para `infrastructure`
5. Adicione testes para novas funcionalidades

---

