# DESIGN.md — todo-listercise

A small, demoable todo app built to show a specific stack in a job-application portfolio: FastAPI, React/TypeScript, feature flags, PostgreSQL, local Kubernetes, and observability.

This document is a design, not an implementation plan. Each section is meant to be discussed and revised before we build.

---

## 1. Purpose

Show, in one running system, that I can:

- ship a typed React UI against a Python API
- persist real data in PostgreSQL
- gate a visible product behavior behind a feature flag
- run the whole thing on Kubernetes locally
- emit traces/metrics/logs and inspect them in Grafana

The product itself is intentionally small. The value is the *shape* of the system, not todo-list novelty.

**Success for a demo:** clone → `make up` → open the app, flip a flag, see the UI change, then open Grafana and point at a request that just happened.

---

## 2. Product

A single-user todo list.

**Always available**

- Create, list, complete, delete todos
- Persist across refresh

**Flag-gated: `priorities`**

When on:

- each todo has a priority (`1` highest … `5` lowest)
- the UI shows a priority control and a filter
- the API accepts and returns `priority` as an integer

When off:

- the field is hidden in the UI
- the API still stores it (so flipping the flag back does not lose data)
- create/update ignore client-supplied priority and keep the default

This is a real product flag, not a cosmetic toggle: it changes both API contract *usage* and UI. That is the point of the demo. The SPA does not wire `priorities` yet.

**Flag-gated: `completed_sparkles` (UI-only)**

When on, completing a todo emits a short sparkle burst on that row. When off (or the flag row is missing), complete behaves as usual. The API does not evaluate this flag.

Other flag ideas we can swap in later (same plumbing): due dates, bulk complete, “focus mode” (incomplete only).

**Out of scope for v1**

- Auth, multi-user, sharing
- Mobile / PWA
- Public cloud deploy
- Third-party flag SaaS (LaunchDarkly, Unleash, etc.)

---

## 3. High-level architecture

```
Browser
  └─ React (nginx)  ──HTTP──►  FastAPI
                                  ├─ PostgreSQL
                                  └─ evaluates flags from DB

kind cluster
  todo-ui           Deployment + Service (NodePort :8080)
  todo-service      Deployment (app + Alloy sidecar) + Service (NodePort :8000)
  postgres          StatefulSet + hostPath + Service (NodePort :5432)
  prometheus        Deployment + Service   # metrics store
  tempo             Deployment + Service   # trace store
  loki              Deployment + Service   # log store
  grafana           Deployment + Service (NodePort :3000)
```

These four are the observability backends. They do not serve todos. Alloy (sidecar on `todo-service`) is the only process that talks to the app; it writes metrics into Prometheus, traces into Tempo, and logs into Loki. Grafana is the browser UI that reads from all three.

| Service | Stores | Answers | This cluster |
|---|---|---|---|
| **Prometheus** | Time-series metrics (numbers over time) | How many? How slow? How broken? | Receives OTLP from Alloy; PromQL |
| **Tempo** | Traces (one request’s span tree) | What happened inside *this* `POST /todos`? | Receives OTLP from Alloy |
| **Loki** | Logs | What did this request print? | Receives OTLP logs from Alloy |
| **Grafana** | Almost nothing (dashboards + datasource config) | Show me the graph / the trace / the logs | NodePort `:3000` |

**Deployment + Service** for Prometheus, Tempo, Loki, and Grafana: one replica, a stable DNS name (`prometheus:9090`, `tempo:4317`, `loki:3100`, `grafana:3000`). Data dirs are kind `extraMounts` of repo `.kind-data/` (hostPath), so `make down` / `make up` keeps Postgres and telemetry. `rm -rf .kind-data` wipes it. Humans open Grafana, the UI, and DBeaver; Prometheus, Tempo, Loki, and Alloy stay cluster-internal.

One namespace: `todo-listercise`. Laptop access is kind extraPortMappings + NodePort (UI `:8080`, API `:8000`, Grafana `:3000`, Postgres `:5432`).

**Why this shape**

- `todo-ui` and `todo-service` are separate images/services so Kubernetes and observability are real, not a single process pretending.
- Flags live in Postgres next to app data — no extra vendor, and the flag table is itself observable.
- Grafana is a *cluster service*, not a sidecar. The sidecar is a collector (Grafana Alloy) sitting next to the API process.

---

## 4. Backend (FastAPI)

Python 3.12 (pinned), FastAPI, SQLAlchemy 2.x (async) + asyncpg, Pydantic v2, Alembic for migrations. Package lives in `todo-service/`, managed with `uv` and a lockfile.

**Inner loop** is Compose (Postgres on host `:5433`) + `uv` on the host. **Demo loop** is `make up` (kind).

### 4.1 HTTP surface

| Method | Path | Notes |
|---|---|---|
| `GET` | `/healthz` | liveness: process up |
| `GET` | `/readyz` | readiness: can reach Postgres |
| `GET` | `/todos` | list, optional `?status=` / `?priority=` |
| `POST` | `/todos` | create |
| `PATCH` | `/todos/{id}` | update title / completed / priority |
| `DELETE` | `/todos/{id}` | delete |
| `GET` | `/flags` | current flag map for the UI |
| `PUT` | `/flags/{key}` | flip a flag (demo admin; no auth in v1) |

Keep the API boring. The interesting parts are flag evaluation, instrumentation, and probes.

### 4.2 Flag evaluation

`FlagService.is_enabled(FlagKey.PRIORITIES)` — a class, not scattered `if`s. FastAPI `Depends()` injects `FlagService` / `TodoService`. Routers stay thin. Flag names are a `FlagKey` StrEnum; a missing DB row evaluates to off.

`GET /flags` is what the React app uses. The backend also evaluates the same flags on write so a crafted request cannot enable a gated field when the flag is off.

### 4.3 Config

12-factor: `DATABASE_URL`, `LOG_LEVEL`, optional `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_SERVICE_NAME` from env. Unset OTLP endpoint → exporters are no-ops (inner loop). In-cluster the app sends OTLP HTTP to the Alloy sidecar at `http://127.0.0.1:4318`. Logs are JSON on stdout (structlog) with `trace_id` / `span_id` injected, and also exported over OTLP so Loki can show them without a DaemonSet.

### 4.4 Decisions (locked)

- Async SQLAlchemy, matching FastAPI.
- Flags are DB-backed (`flag` table) so a live demo can flip them without restarting pods.

---

## 5. todo-ui (React / TypeScript)

Vite + React + TypeScript SPA in `todo-ui/`. Inner loop: Vite on `:5173` proxies `/api` to uvicorn. Kind image: static `dist/` behind nginx (`try_files` + `/api/` proxy to `todo-service:8000`).

**Screens:** one page. Add / list / complete / delete todos, plus a status filter. Completing a todo sparkles when `completed_sparkles` is on. No flag admin UI. `priorities` is not wired in the SPA yet.

**Stack**

- TanStack Query for todos
- `FlagProvider` port (`isEnabled` + `subscribe`) with an HTTP adapter (`GET /api/flags`, in-memory cache + 5s poll). Swap-in later: LaunchDarkly. No OpenFeature SDK in v1. `useFlag(FlagKey.CompletedSparkles)` gates the complete sparkle.
- Tailwind CSS v4
- Storybook, Vitest, Playwright
- Typed ports + React Context (constructor-style DI). Components do not `fetch`

---

## 6. Feature flags

Treat flags as a first-class concept, not an env var.

**Model**

```
flag
  key          text primary key   -- FlagKey value, e.g. "priorities"
  enabled      boolean not null
  description  text
  updated_at   timestamptz
```

One row per flag. Seed `priorities = false` and `completed_sparkles = false`. Runtime code uses a `FlagKey` enum (Python StrEnum / TypeScript string enum); those values are the `key` text.

**Evaluation rules**

- Boolean flags only in v1 (no percentages, no targeting). The *concept* is what we need to show.
- Backend is source of truth. todo-ui never decides “is this on?” from localStorage.
- Missing row or unknown key evaluates to off. `PUT /flags/{key}` is 404 if the row does not exist (not an upsert).
- Flag reads are cached in-process for a few seconds so a list request does not add a second query. Cache invalidates on `PUT`.
- todo-ui caches `GET /flags` in memory and polls every 5s so a live `PUT` shows up without a request on every render.

**What we are explicitly not doing**

- User targeting, gradual rollout, experiments
- OpenFeature SDK — worth a follow-up if we want the vendor-neutral story, but it is extra surface for one boolean

**Demo beat:** create todos → flip `completed_sparkles` on → complete an item, sparkles → flip `priorities` on → (later) priority UI appears → flip off → UI hides, data remains.

---

## 7. PostgreSQL

One database, two tables. Snake_case, **singular** names.

```
list_item
  id           uuid pk
  title        text not null
  completed    boolean not null default false
  priority     smallint not null default 3   -- 1 highest … 5 lowest; CHECK 1–5
  created_at   timestamptz not null
  updated_at   timestamptz not null
```

**Why keep `priority` even when the flag is off:** flag-off should not require a migration or destroy data. That is a realistic flag lesson.

**In cluster:** official Postgres image, StatefulSet, credentials from a Secret. Data is a hostPath under `.kind-data/postgres` (kind extraMount), not a PVC, so it survives `kind delete cluster`. No HA, no replicas.

**Migrations:** Alembic runs as a Kubernetes Job (or an init container) before the API becomes Ready. Prefer a Job so a crash is visible as a failed Job, not a CrashLooping API.

**Discuss:** init container vs Job; whether we bother with a managed-looking operator (overkill for kind).

---

## 8. Kubernetes (kind)

**Why kind:** real Kubernetes API, Docker-backed, no VM tax, standard for local platform work. Minikube is fine too; k3d is faster. kind is the most widely recognized on resumes.

**Cluster**

- One control-plane node is enough
- kind `extraPortMappings` + NodePort so laptop URLs stay up after `make up` exits (no long-running `kubectl port-forward`)

**Workloads**

| Workload | Kind | Notes |
|---|---|---|
| `todo-ui` | Deployment, 1 replica | nginx serving the SPA + `/api` proxy; NodePort `:8080` |
| `todo-service` | Deployment, 1 replica | FastAPI + Alloy sidecar; NodePort `:8000` |
| `postgres` | StatefulSet, 1 replica | hostPath `.kind-data/postgres`; NodePort `:5432` for DBeaver |
| `prometheus` | Deployment | OTLP / remote-write receiver; hostPath `.kind-data/prometheus` |
| `tempo` | Deployment | receive OTLP traces; hostPath `.kind-data/tempo` |
| `loki` | Deployment | receive OTLP logs; hostPath `.kind-data/loki` |
| `grafana` | Deployment | provisioned datasources + one dashboard; NodePort `:3000`; hostPath `.kind-data/grafana` |

**Probes**

- todo-ui: nginx `/`
- todo-service liveness: `/healthz`
- todo-service readiness: `/readyz` (Postgres ping)
- Alloy: `/-/ready` on the sidecar HTTP port

**Images**

- Build locally, `kind load docker-image` so we never need a registry
- Backend: distroless or slim Python
- todo-ui: multi-stage `node` build → `nginx:alpine`

**Manifests:** Helm chart in `k8s/chart/` (`values.yaml` is the kind NodePorts / images / hostPaths). `make up` runs `helm upgrade --install`. kind cluster config is `k8s/kind/cluster.yaml`.

**Discuss:** kind vs k3d; Helm vs Kustomize; Ingress (nginx/contour) vs NodePort. Locked for this repo: kind, Helm, NodePort.

---

## 9. Observability and telemetry

Three signals, one UI.

### 9.1 What emits

**Backend (OpenTelemetry SDK + auto-instrumentation)**

- Traces: incoming FastAPI request → SQLAlchemy spans
- Metrics: request count/latency/errors (RED), plus app counters `todos_created`, `todos_completed`, `flag_evaluations`
- Logs: structured JSON to stdout (`trace_id` / `span_id` injected) and OTLP export to Alloy → Loki

**todo-ui (optional v1)**

- Skip browser RUM initially. If we add it later: a single page-load + fetch span via OTel browser SDK. Easy to bolt on; easy to skip for the first demo.

**Alloy sidecar**

Grafana Alloy in the todo-service pod:

- receives OTLP from the app on localhost (no cluster DNS hop for the app)
- remote-writes metrics to Prometheus
- forwards traces to Tempo
- forwards logs to Loki
- ready probe on `/-/ready`

This is the “Grafana sidecar”: Alloy, not the Grafana UI. Putting Grafana itself in the app pod would be unusual and would couple dashboards to app restarts.

### 9.2 Prometheus — metrics

Prometheus is a time-series database. It stores *samples*: a metric name, labels, a timestamp, and a number.

It does **not** store request bodies, SQL, or “what this one call did.” That is Tempo. Prometheus answers aggregates: request rate, p95 latency, error count, `todos_created`, `flag_evaluations`.

**In this app**

- Alloy remote-writes (OTLP HTTP to Prometheus `/api/v1/otlp`) RED metrics plus the custom counters
- One scrape/remote-write interval is enough (15s)
- Retention: default / short. A laptop demo does not need weeks of history
- Image: official `prom/prometheus`. Config is a ConfigMap (OTLP receiver enabled)

**Why not skip it and only use Tempo:** a trace is one request. A dashboard that shows “creates per minute” needs a metrics store.

### 9.3 Tempo — traces

Grafana Tempo is a trace backend. A *trace* is a tree of *spans* for a single request (e.g. `POST /todos` → `SQL INSERT`). Tempo stores those trees and lets you look one up by trace id.

It does **not** do PromQL or long-term numeric aggregates. It answers “show me this request.”

**In this app**

- FastAPI OTel SDK emits OTLP to Alloy on localhost; Alloy forwards to Tempo
- Auto-instrument FastAPI + SQLAlchemy so a create-todo trace includes the INSERT span
- Image: official `grafana/tempo`. Single-binary / local mode (monolithic), not the microservices deploy
- Receive OTLP (gRPC `:4317` and/or HTTP `:4318`)

**Why Tempo and not Jaeger:** same job; Tempo is the Grafana-native piece, so Explore → trace is one vendor story with the dashboard.

### 9.4 Grafana — the UI

Grafana is the frontend for the other three. It does not ingest telemetry from the app. It has *datasources* (Prometheus, Tempo, Loki) and *dashboards* (JSON we ship in `k8s/chart/files/`).

**In this app**

- Provision datasources and one dashboard at startup (ConfigMap → Grafana provisioning dir)
- Dashboard: request rate, p95, errors, todo counters, and recent logs
- Anonymous Editor, no login, NodePort `:3000` (Explore works without a password)
- Image: official `grafana/grafana`
- Derived field: log `trace_id` → Tempo

Trace → metrics: Grafana can jump from a spike on `todos_created` to traces in the same time window (exemplars later if we want; not required for v1).

Trace → log correlation via `trace_id` in log lines. Loki is a fourth Deployment (log store), same pattern as Tempo.

### 9.5 What a demo looks like

1. Create a todo in the UI
2. Grafana: spike on `todos_created`, a trace named `POST /todos` with a SQL span, logs with that `trace_id`
3. Flip `completed_sparkles`, complete a todo (sparkles)
4. Grafana: `flag_evaluations` / a `PUT /flags/completed_sparkles` trace

### 9.6 Discuss

- Alloy sidecar vs cluster-level OTel Collector Deployment (sidecar is the story you asked for; a collector Deployment is more “production”)
- Prometheus+Tempo vs Grafana Cloud (local-only wins for a laptop demo)
- Loki: in (OTLP from Alloy; Explore + dashboard logs panel)
- Instrument todo-ui or keep telemetry server-side

---

## 10. Local workflow

Two loops, mutually exclusive on host ports `8000` (uvicorn vs API NodePort). Compose Postgres uses `:5433`; kind DBeaver uses `:5432`.

**Demo:** one command brings up the full kind stack. On this machine, Docker/kind need `sg docker`:

```text
sg docker -c 'make up'     # kind create (if needed) + build + load + apply + wait
sg docker -c 'make down'   # delete the kind cluster (keeps .kind-data/)
```

`make up` fails fast if `5432` / `8000` / `8080` / `3000` are already bound. Stop uvicorn before demo; `make down` before Vite + Compose if you need `:8000` again. Postgres and telemetry live in `.kind-data/` on the laptop and survive cluster delete.

| What | Laptop URL |
|---|---|
| Frontend UI | http://localhost:8080 |
| Backend API | http://localhost:8000 |
| Grafana | http://localhost:3000 |
| Postgres (DBeaver) | `localhost:5432` (db `todo_listercise`, user/password `todo`) |

**Inner loop:** Compose runs Postgres only (host `:5433`). The API runs on the host under `uv`.

```text
docker compose up -d postgres
cd todo-service && uv sync
uv run alembic upgrade head
uv run uvicorn todo_listercise.main:app --reload --port 8000
```

Compose is never the demo path. Optional profile `api` builds the production image against Compose Postgres to smoke-test the Dockerfile.

---

## 11. Repo layout (proposed)

```text
todo-listercise/
  DESIGN.md
  README.md
  docker-compose.yml
  Makefile            `make up` / `make down`
  todo-service/       FastAPI app, Alembic, Dockerfile
  todo-ui/            Vite React TS, nginx Dockerfile
  k8s/
    kind/cluster.yaml
    chart/            Helm chart (templates + values.yaml + files/)
```

---

## 12. Demo script (interview)

~5 minutes:

1. `kubectl get pods -n todo-listercise` — everything Running, two containers on `todo-service` (app + alloy)
2. Open the app, add/complete a todo
3. Complete a todo; `PUT /flags/completed_sparkles` on; complete another and see sparkles. `priorities` still API-only.
4. Grafana dashboard + Explore (metrics, Loki logs, Tempo trace into the Postgres span)
5. If asked “how would you do this for real?”: managed Postgres, LaunchDarkly or OpenFeature behind `FlagProvider`, Ingress + TLS, auth, HPA, Grafana Cloud or a proper LGTM stack

---

## 13. Decisions to confirm

| # | Topic | Current proposal |
|---|---|---|
| 1 | Cluster tool | kind |
| 2 | Manifests | Helm chart (`k8s/chart`), not Kustomize |
| 3 | Flag storage | Postgres table + in-process cache |
| 4 | Gated feature | `priorities` on todos (API); `completed_sparkles` in the SPA |
| 5 | Collector | Grafana Alloy sidecar on todo-service |
| 6 | Backends | Prometheus + Tempo + Loki |
| 7 | todo-ui data | TanStack Query for todos |
| 8 | Flag toggle UX | deferred; SPA reads flags via `FlagProvider`, wires `completed_sparkles` |
| 9 | Inner loop | Compose Postgres (`:5433`) + `uv` on the host |
| 10 | Auth | none in v1 |
| 11 | Demo bring-up | `make up` (kind + NodePort; no long-running port-forward) |

---

## 14. What this is not

Not a production todo SaaS. Not a platform-engineering showcase of 15 operators. Not a design-system exercise.

If a section starts growing past “I can explain this in two minutes,” it is too big for the portfolio.
