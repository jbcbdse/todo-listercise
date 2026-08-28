# todo-listercise

Portfolio todo app: FastAPI, React/TypeScript, feature flags, PostgreSQL, local Kubernetes, observability.

See [DESIGN.md](DESIGN.md) for the full design.

## Two loops

Compose (inner) and kind (demo) are mutually exclusive on this laptop. They do not share a network; they fight over host ports.

| Loop | Command | When |
|---|---|---|
| Inner | Compose Postgres + `uv` API + Vite | Daily service/UI work |
| Demo | `sg docker -c 'make up'` | Full kind stack |

| Port | Inner loop | kind (`make up`) |
|---|---|---|
| 5432 | unused | kind Postgres NodePort (DBeaver) |
| 5433 | Compose Postgres | unused |
| 8000 | uvicorn | API NodePort |
| 5173 | Vite | unused |
| 8080 | unused | UI NodePort |
| 3000 | unused | Grafana NodePort |

Stop uvicorn before `make up` (`:8000`). `make down` before using Vite + Compose again if you also need `:8000`.

## Demo loop (kind)

Requires Docker, kind, kubectl, and Helm. On this machine, wrap with `sg docker`:

```bash
sg docker -c 'make up'
```

`make up` creates the cluster if needed, builds and loads images, installs the Helm chart, waits until Ready, and prints URLs. It fails fast if `5432` / `8000` / `8080` / `3000` are already bound.

Postgres, Prometheus, Tempo, Loki, and Grafana store data in `.kind-data/` on the laptop (kind extraMount). `make down` deletes the cluster but keeps that directory; the next `make up` remounts it. Wipe with `rm -rf .kind-data`.

| What | URL |
|---|---|
| Frontend UI | http://localhost:8080 |
| Backend API | http://localhost:8000 (`/docs`) |
| Grafana | http://localhost:3000 (anonymous, no login) |
| Postgres (DBeaver) | `localhost:5432` — database `todo_listercise`, user/password `todo` |

Cluster-internal only (not opened in a browser): Alloy sidecar `localhost:4318` in the app pod, Prometheus `prometheus:9090`, Tempo `tempo:4317`, Loki `loki:3100`.

```bash
sg docker -c 'make down'   # deletes the kind cluster; keeps .kind-data/
```

Demo beat: `make up` → UI → create/complete a todo → Grafana Explore for logs, metrics, and traces.

## Inner loop (todo-service)

Requires Python 3.12 (via `uv`) and Docker for Postgres.

```bash
docker compose up -d postgres
cd todo-service
uv sync
uv run alembic upgrade head
uv run uvicorn todo_listercise.main:app --reload --port 8000
```

API: `http://localhost:8000` (docs at `/docs`).

```bash
uv run ruff check . && uv run ruff format --check . && uv run mypy src tests
uv run pytest
```

E2E tests use Testcontainers (real Postgres) and skip if Docker is not running.

Optional: `docker compose --profile api up --build` smoke-tests the production image against Compose Postgres. Run migrations first (`uv run alembic upgrade head` still talks to `localhost:5433`).

## Inner loop (todo-ui)

Requires Node 22+ (npm) and the API on `:8000`. Vite proxies `/api` to uvicorn. Nginx is not used here.

```bash
cd todo-ui
npm install
npm run dev
```

UI: `http://localhost:5173`.

```bash
npm run lint && npm test
npx playwright test   # skips if the API is down
npm run storybook
```

## Configuration

| Variable | Default |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://todo:todo@localhost:5433/todo_listercise` |
| `LOG_LEVEL` | `info` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset (no-op exporters). Kind: `http://127.0.0.1:4318` |
| `OTEL_SERVICE_NAME` | `todo-service` |
