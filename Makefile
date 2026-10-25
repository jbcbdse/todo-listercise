CLUSTER := todo-listercise
NS := todo-listercise
KIND ?= kind
KUBECTL ?= kubectl
HELM ?= helm
DOCKER ?= docker
KIND_DATA := $(CURDIR)/.kind-data
KIND_NODE := $(CLUSTER)-control-plane

.NOTPARALLEL:
.PHONY: up down cluster images load apply wait urls check-ports

up: check-ports cluster images load apply wait urls

down:
	$(KIND) delete cluster --name $(CLUSTER)

check-ports:
	@fail=0; \
	for p in 5432 8000 8080 3000; do \
	  if python3 -c "import socket,sys; s=socket.socket(); sys.exit(0 if s.connect_ex(('127.0.0.1', int('$$p')))==0 else 1)"; then \
	    echo "port $$p already in use"; fail=1; \
	  fi; \
	done; \
	if [ "$$fail" = 1 ]; then \
	  echo "stop uvicorn (and docker compose if it owns 5432/8000) before make up"; \
	  exit 1; \
	fi

cluster:
	mkdir -p $(KIND_DATA)/postgres $(KIND_DATA)/prometheus $(KIND_DATA)/tempo $(KIND_DATA)/loki $(KIND_DATA)/grafana
	chmod a+rwx $(KIND_DATA)/postgres $(KIND_DATA)/prometheus $(KIND_DATA)/tempo $(KIND_DATA)/loki $(KIND_DATA)/grafana
	@python3 -c "from pathlib import Path; Path(r'$(KIND_DATA)/cluster.yaml').write_text(Path('k8s/kind/cluster.yaml').read_text().replace('KIND_DATA_PATH', r'$(KIND_DATA)'))"
	@if $(KIND) get clusters | grep -qx $(CLUSTER); then \
		if ! $(DOCKER) exec $(KIND_NODE) test -d /mnt/kind-data; then \
			echo "kind cluster is missing the host data mount; run: make down && make up"; \
			exit 1; \
		fi; \
	else \
		$(KIND) create cluster --name $(CLUSTER) --config $(KIND_DATA)/cluster.yaml; \
	fi

images:
	$(DOCKER) build -t todo-service:local todo-service
	$(DOCKER) build -t todo-ui:local todo-ui

load:
	$(KIND) load docker-image todo-service:local todo-ui:local --name $(CLUSTER)

apply:
	-$(KUBECTL) -n $(NS) delete job migrate --ignore-not-found
	$(HELM) upgrade --install $(CLUSTER) k8s/chart --namespace $(NS) --create-namespace
	$(KUBECTL) -n $(NS) rollout restart deploy/todo-service deploy/todo-ui

wait:
	$(KUBECTL) -n $(NS) rollout status statefulset/postgres --timeout=300s
	$(KUBECTL) -n $(NS) wait --for=condition=complete job/migrate --timeout=300s
	$(KUBECTL) -n $(NS) wait --for=condition=available deploy/todo-service deploy/todo-ui deploy/grafana deploy/prometheus deploy/tempo deploy/loki --timeout=300s

urls:
	@echo ""
	@echo "todo-listercise is up (kind cluster: $(CLUSTER))"
	@echo ""
	@echo "  Frontend UI     http://localhost:8080"
	@echo "  Backend API     http://localhost:8000   (docs /docs)"
	@echo "  Grafana         http://localhost:3000   (anonymous, no login)"
	@echo "  Postgres        localhost:5432          (DBeaver: db todo_listercise, user/password todo)"
	@echo ""
	@echo "Cluster-internal (not forwarded):"
	@echo "  Alloy sidecar   localhost:4318 in the todo-service pod"
	@echo "  Prometheus      prometheus:9090"
	@echo "  Tempo           tempo:4317"
	@echo "  Loki            loki:3100"
	@echo ""
