# 📊 Node Analytics API

Um projeto prático focado em observabilidade, construído com **Node.js**, **Express**, **PostgreSQL** e uma stack completa de monitoramento (**Prometheus**, **Grafana**, **Loki**, **Promtail**).

## 🎯 Objetivos

Este projeto foi construído como um estudo focado para entender e aplicar:

- **Autenticação JWT** — Implementação de rotas protegidas usando JSON Web Tokens.
- **Gerenciamento de Pool de Conexões** — Configuração e monitoramento de conexões com o PostgreSQL.
- **Rate Limiting Customizado** — Construção de um limitador de taxa em memória (100 req/min).
- **Coleta de Métricas** — Instrumentação de uma API com contadores, medidores e resumos do Prometheus.
- **Agregação de Logs** — Logs estruturados em JSON utilizando Pino, coletados pelo Loki através do Promtail.
- **Visualização** — Construção de dashboards avançados no Grafana para correlacionar métricas e logs.
- **Testes de Carga** — Utilização do k6 para testes de estresse na API e observação de comportamento sob carga.

## 🏗️ Arquitetura

```
┌──────────┐     ┌───────────┐     ┌───────────────┐
│ Frontend │────▶│    API    │────▶│  PostgreSQL   │
│ (Vite)   │     │ (Express) │     │ (Users/Tickets)│
└──────────┘     └─────┬─────┘     └───────────────┘
                       │
               ┌───────┼────────┐
               ▼       ▼        ▼
         ┌──────┐ ┌────────┐ ┌──────────┐
         │Prom. │ │ Loki   │ │ Promtail │
         └──┬───┘ └────┬───┘ └──────────┘
            │          │
            ▼          ▼
         ┌─────────────────┐
         │     Grafana     │
         │  (Dashboards)   │
         └─────────────────┘
```

## 🚀 Como Iniciar

### Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [k6](https://k6.io/) (para testes de carga)

### Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/node-analytics-api.git
   cd node-analytics-api
   ```

2. **Crie seu arquivo `.env`:**
   ```bash
   cp .env.example .env
   # Edite o .env com suas credenciais preferidas
   ```

3. **Inicie os serviços:**
   ```bash
   docker compose up -d --build
   ```

4. **Acesse os serviços:**

   | Serviço    | URL                    |
   |------------|------------------------|
   | API        | http://localhost:3000  |
   | Frontend   | http://localhost:5173  |
   | Prometheus | http://localhost:9090  |
   | Grafana    | http://localhost:3001  |
   | Loki       | http://localhost:3100  |

### Configuração do Grafana

1. Faça login com o usuário `admin` e a senha definida em `GF_SECURITY_ADMIN_PASSWORD` no seu `.env`.
2. Adicione a fonte de dados do **Prometheus** → URL: `http://prometheus:9090`.
3. Adicione a fonte de dados do **Loki** → URL: `http://loki:3100`.

## 🧪 Testes de Carga

Execute o teste de carga do k6 para observar o comportamento do limitador de taxa e do pool de conexões sob pressão:

```bash
k6 run tests/load_test.js
```

## 📂 Estrutura do Projeto

```
├── backend/             # API em Node.js + Express
│   └── src/
│       ├── controllers/ # Controladores das rotas
│       ├── middlewares/ # Limite de taxa, validação e autenticação (JWT)
│       ├── routes/      # Rotas do Express
│       ├── schemas/     # Validação de dados de entrada
│       └── services/    # Banco de Dados, Logger, Métricas
├── frontend/            # Interface UI (Vite + Vanilla JS)
├── database/            # Esquemas de banco SQL (Tabelas Users, Tickets, etc.)
├── prometheus/          # Configuração do Prometheus
├── loki/                # Configuração do Loki
├── promtail/            # Configuração do Promtail
├── tests/               # Testes de carga utilizando k6
└── docker-compose.yml
```

## 🔍 Principais Funcionalidades

- **Autenticação Segura** — Proteção de rotas utilizando tokens JWT.
- **Histórico de Tickets** — Sistema de auditoria e registro de ações/logs em cada ticket.
- **Logs Estruturados** — Logs em formato JSON focados no padrão `module`/`action` utilizando o Pino logger.
- **Métricas Customizadas** — Contadores de requisições HTTP, medidores de conexões ativas no BD e registro de tempo de execução das consultas.
- **Rate Limiting** — Limitação de acesso baseada em IP (100 requisições por minuto) protegendo contra abusos.
- **Observabilidade Total** — Correlação imersiva entre métricas e logs direto no Grafana.

## 📜 Licença

Este projeto é de código aberto e está disponível sob a [Licença MIT](LICENSE).
