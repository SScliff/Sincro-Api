# API Documentation

Base URL: `/api/v1`

---

## Health

### `GET /health`
Verifica se a API está online.

**Response `200`**
```json
{ "status": "ok" }
```

---

## Auth

### `POST /auth/register`
Cria um novo usuário.

**Body**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response `201`**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "role": "user",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### `POST /auth/login`
Autentica um usuário e retorna o token JWT.

**Body**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response `200`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

> O token retornado deve ser enviado no header `Authorization: Bearer <token>` em todas as rotas protegidas.

---

## Tickets

> Todas as rotas de tickets requerem autenticação via `Authorization: Bearer <token>`.

### `POST /tickets`
Cria um novo ticket.

**Body**
```json
{
  "title": "Tela quebrada",
  "description": "Tela do notebook trincada no canto superior",
  "priority": "Alta",
  "model": "Dell Inspiron 15",
  "proprietary_id": 3,
  "cost": 450.00
}
```

| Campo | Tipo | Obrigatório | Valores aceitos |
|---|---|---|---|
| `title` | string | ✅ | — |
| `description` | string | ❌ | — |
| `priority` | string | ❌ | `Baixa`, `Média`, `Alta` — padrão: `Baixa` |
| `model` | string | ❌ | — |
| `proprietary_id` | int | ❌ | ID de um proprietário cadastrado |
| `cost` | float | ❌ | — |

**Response `201`** — retorna o ticket criado com `status: "Novo"` e `is_archived: false`.

---

### `GET /tickets`
Lista todos os tickets do usuário autenticado.

**Query params opcionais**

| Param | Tipo | Descrição |
|---|---|---|
| `status` | string | Filtra por status: `Novo`, `em orçamento`, `em reparo`, `concluido`, `arquivado` |
| `priority` | string | Filtra por prioridade: `Baixa`, `Média`, `Alta` |
| `archived` | boolean | `true` para listar tickets arquivados. Padrão: `false` |
| `delay` | int | Atraso artificial em ms (uso em testes) |

**Exemplo**
```
GET /api/v1/tickets?status=Novo&priority=Alta
GET /api/v1/tickets?archived=true
```

**Response `200`**
```json
[
  {
    "id": 1,
    "title": "Tela quebrada",
    "model": "Dell Inspiron 15",
    "proprietary_id": 3,
    "proprietary_name": "Carlos Souza",
    "proprietary_phone": "85999990000",
    "cost": 450.00,
    "description": "Tela do notebook trincada no canto superior",
    "status": "Novo",
    "priority": "Alta",
    "is_archived": false,
    "user_id": 1,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### `GET /tickets/:id`
Retorna um ticket específico pelo ID.

**Response `200`** — mesmo schema do item acima, objeto único.

**Response `404`**
```json
{ "message": "Ticket não encontrado" }
```

---

### `PATCH /tickets/:id`
Atualiza parcialmente um ticket. Envie apenas os campos que deseja alterar.

**Body (todos opcionais)**
```json
{
  "title": "Novo título",
  "description": "Descrição atualizada",
  "status": "em reparo",
  "priority": "Média",
  "model": "Dell XPS 13",
  "proprietary_id": 5,
  "cost": 300.00
}
```

| Campo `status` | Descrição |
|---|---|
| `Novo` | Ticket recém aberto |
| `em orçamento` | Aguardando aprovação de custo |
| `em reparo` | Reparo em andamento |
| `concluido` | Serviço finalizado |
| `arquivado` | Encerrado/arquivado |

**Response `200`** — retorna o ticket atualizado.

---

### `PATCH /tickets/:id/archive`
Arquiva um ticket (soft delete). Muda `is_archived` para `true` e `status` para `arquivado` sem remover o registro do banco.

**Response `200`**
```json
{
  "message": "Ticket arquivado com sucesso",
  "ticket": { "..." }
}
```

---

### `DELETE /tickets/:id`
Remove permanentemente um ticket. Esta ação não pode ser desfeita.

**Response `200`**
```json
{ "message": "Ticket apagado com sucesso" }
```

---

## Proprietary (Proprietários)

> Todas as rotas de proprietários requerem autenticação via `Authorization: Bearer <token>`.

### `POST /proprietary`
Cadastra um novo proprietário.

**Body**
```json
{
  "name": "Carlos Souza",
  "phone": "85999990000"
}
```

| Campo | Tipo | Obrigatório |
|---|---|---|
| `name` | string | ✅ |
| `phone` | string | ❌ |

**Response `201`** — retorna o proprietário criado.

---

### `GET /proprietary`
Lista todos os proprietários cadastrados.

**Response `200`**
```json
[
  {
    "id": 1,
    "name": "Carlos Souza",
    "phone": "85999990000",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### `GET /proprietary/:id`
Retorna um proprietário específico pelo ID.

**Response `404`**
```json
{ "message": "Proprietário não encontrado" }
```

---

### `PATCH /proprietary/:id`
Atualiza parcialmente um proprietário.

**Body (todos opcionais)**
```json
{
  "name": "Carlos A. Souza",
  "phone": "85988880000"
}
```

**Response `200`** — retorna o proprietário atualizado.

---

### `DELETE /proprietary/:id`
Remove um proprietário permanentemente.

> ⚠️ Tickets vinculados a este proprietário terão `proprietary_id` definido como `NULL` (comportamento `ON DELETE SET NULL`).

**Response `200`**
```json
{ "message": "Proprietário apagado com sucesso" }
```

---

## Metrics

### `GET /metrics`
Retorna métricas da aplicação no formato Prometheus.

---

## Códigos de erro comuns

| Código | Descrição |
|---|---|
| `400` | Dados inválidos ou campos obrigatórios ausentes |
| `401` | Token ausente ou inválido |
| `404` | Recurso não encontrado |
| `500` | Erro interno do servidor |
