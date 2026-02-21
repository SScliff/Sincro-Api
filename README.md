# 📊 Node Analytics API

An observability study project built with **Node.js**, **Express**, **PostgreSQL**, and a full monitoring stack (**Prometheus**, **Grafana**, **Loki**, **Promtail**).

## 🎯 Objectives

This project was built as a hands-on study to understand:

- **Connection Pool Management** — Configuring and monitoring PostgreSQL connection pools.
- **Custom Rate Limiting** — Building a rate limiter from scratch (in-memory).
- **Metrics Collection** — Instrumenting an API with Prometheus counters, gauges, and summaries.
- **Log Aggregation** — Structured JSON logging with Pino, collected by Loki via Promtail.
- **Visualization** — Building Grafana dashboards to correlate metrics and logs.
- **Load Testing** — Using k6 to stress-test the API and observe behavior under pressure.

## 🏗️ Architecture

```
┌──────────┐     ┌──────────┐     ┌───────────────┐
│ Frontend │────▶│   API    │────▶│  PostgreSQL   │
│ (Vite)   │     │ (Express)│     │               │
└──────────┘     └────┬─────┘     └───────────────┘
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

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [k6](https://k6.io/) (for load testing)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/node-analytics-api.git
   cd node-analytics-api
   ```

2. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred credentials
   ```

3. **Start the stack:**
   ```bash
   docker compose up -d --build
   ```

4. **Access the services:**

   | Service    | URL                    |
   |------------|------------------------|
   | API        | http://localhost:3000   |
   | Frontend   | http://localhost:5173   |
   | Prometheus | http://localhost:9090   |
   | Grafana    | http://localhost:3001   |
   | Loki       | http://localhost:3100   |

### Grafana Setup

1. Login with `admin` / (your `GF_SECURITY_ADMIN_PASSWORD`).
2. Add **Prometheus** data source → URL: `http://prometheus:9090`.
3. Add **Loki** data source → URL: `http://loki:3100`.

## 🧪 Load Testing

Run the k6 load test to observe rate limiting and pool behavior:

```bash
k6 run tests/load_test.js
```

## 📂 Project Structure

```
├── backend/             # Node.js + Express API
│   └── src/
│       ├── controllers/ # Route handlers
│       ├── middlewares/  # Rate limiter
│       ├── routes/       # Express routes
│       └── services/     # DB, Logger, Metrics
├── frontend/            # Vite + Vanilla JS UI
├── database/            # SQL schema
├── prometheus/          # Prometheus config
├── loki/                # Loki config
├── promtail/            # Promtail config
├── tests/               # k6 load tests
└── docker-compose.yml
```

## 🔍 Key Features

- **Structured Logging** — JSON logs with `module`/`action` pattern via Pino.
- **Custom Metrics** — HTTP request counters, DB connection gauges, query duration summaries.
- **Rate Limiting** — In-memory IP-based rate limiter (100 req/min).
- **Full Observability** — Metrics + Logs correlation in Grafana.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
