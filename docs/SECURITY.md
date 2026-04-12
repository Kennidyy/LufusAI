# 🔒 Segurança - Lufus Project

## Visão Geral

Este documento descreve as práticas de segurança implementadas no sistema Lufus.

---

## 1. Autenticação

### Senhas
- **Hash**: Argon2id com pepper
- **Memory Cost**: 65536 KB
- **Time Cost**: 3 iterations
- **Mínimo**: 8 caracteres
- **Requisitos**: Maiúscula, minúscula, número, símbolo

```typescript
// Exemplo de hash
const hash = await Bun.password.hash(password + pepper, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
});
```

### Sessões
- **Duração**: 7 dias
- **Storage**: Arquivo local (`~/.lufus-session`)
- **Token**: 256 bits gerados com `crypto.randomUUID()`

---

## 2. Banco de Dados

### PostgreSQL
- **Autenticação**: SCRAM-SHA-256
- **SSL**: Obrigatório em produção
- **Conexões**: Pool máximo de 20 (produção)

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários com email único |
| `wallets` | Carteiras com Foreign Key para users |
| `events` | Histórico de eventos (Event Sourcing) |

---

## 3. Validação de Input

### Email
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

### UUID
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

### Nome
```typescript
const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
```

### Pontos
- Mínimo: 1
- Máximo: 1.000.000 por transação

---

## 4. Rate Limiting

| Operção | Limite | Janela |
|---------|--------|--------|
| Login | 5 | 15 min |
| Criar usuário | 3 | 15 min |
| Operações gerais | 100 | 1 min |

---

## 5. Headers de Segurança

```typescript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 6. CQRS e Event Sourcing

### Benefícios de Segurança

O Event Sourcing fornece um **audit trail** completo:

```sql
-- Ver todas operações de um usuário
SELECT * FROM events 
WHERE aggregate_id = 'user-uuid'
ORDER BY occurred_at DESC;

-- Ver histórico de pontos
SELECT event_type, event_data->>'points' as points
FROM events
WHERE event_type IN ('PointsAdded', 'PointsRemoved')
ORDER BY occurred_at DESC;
```

### Imutabilidade
- Eventos são **append-only**
- Não há UPDATE ou DELETE na tabela `events`
- Garantia de integridade do histórico

---

## 7. Checklist de Produção

### Obrigatório
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` com `?sslmode=require`
- [ ] `PASSWORD_PEPPER` gerado com `openssl rand -hex 32`
- [ ] `POSTGRES_PASSWORD` mínimo 16 caracteres
- [ ] Firewall bloqueando portas desnecessárias
- [ ] Backups automatizados do banco

### Recomendado
- [ ] Monitoramento de tentativas de login
- [ ] Alertas para rate limit excedido
- [ ] Logs centralizados
- [ ] Rotação de senhas periódica
- [ ] Tests de segurança automatizados

---

## 8. Secrets Não Commitados

### Arquivos Ignorados
```
.env
.lufus-session
drizzle.config.json
```

### Variáveis de Ambiente Obrigatórias
```bash
POSTGRES_PASSWORD=senha_forte_16+_chars
PASSWORD_PEPPER=$(openssl rand -hex 32)
LUFUS_API_KEY=$(openssl rand -hex 64)
```

---

## 9. Vulnerabilidades Prevenidas

| Vulnerabilidade | Proteção |
|-----------------|----------|
| SQL Injection | Drizzle ORM (parametrizado) |
| XSS | Escape de caracteres |
| CSRF | Tokens de sessão |
| Brute Force | Rate limiting |
| Password Leak | Argon2id + pepper |
| Session Hijacking | Token de 256 bits |
| Data Tampering | Eventos imutáveis |

---

## 10. Reporting de Vulnerabilidades

Se encontrar uma vulnerabilidade:
1. **NÃO** abra issue pública
2. Envie email para: security@example.com
3. Descreva o problema detalhadamente
4. Aguarde resposta em até 48h

---

**Versão:** 1.0.0  
**Última atualização:** 11-04-2026
