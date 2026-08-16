# todo-listercise

Portfolio todo app: FastAPI, React/TypeScript, feature flags, PostgreSQL, local Kubernetes, observability.

See [DESIGN.md](DESIGN.md) for the full design.

## Two loops

| Loop | Command | When |
|---|---|---|
| Inner | Compose Postgres + `uv` on the host | Daily service work |
| Demo | `make up` | Full kind stack (not wired yet) |

`make up` is the end-goal: one command for images, Postgres, API, frontend, Alloy, Prometheus, Tempo, Grafana, migrate Job, and port-forwards. Compose is never the demo path.

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

Optional: `docker compose --profile api up --build` smoke-tests the production image against Compose Postgres. Run migrations first (`uv run alembic upgrade head` still talks to `localhost:5432`).

## Configuration

| Variable | Default |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://todo:todo@localhost:5432/todo_listercise` |
| `LOG_LEVEL` | `info` |
