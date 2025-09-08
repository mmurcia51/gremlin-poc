# Gremlin PoC — Dual Mode (Kubernetes Agent + ECS Failure Flags)

Este repositorio contiene una **aplicación de ejemplo** (A→B con pseudo‑DB) y los **manifiestos** para ejecutar:
- **Kubernetes (on‑prem o local)** con **Agente Gremlin** para ataques de CPU/Memoria/Red/Shutdown.
- **AWS ECS Fargate** con **Failure Flags (sidecar)** para latencia/errores a nivel de código.

> Recomendado: leer primero `docs/guia-paso-a-paso.md`.

## Estructura
- `apps/api-gateway` — Servicio A (puerto 3000) que llama a Payments.
- `apps/payments` — Servicio B (puerto 3001) con una “pseudo‑DB” y Failure Flags (`payments-handler`, `db-query`).
- `k8s/` — Manifiestos de Kubernetes listos para `kubectl apply -f`.
- `ecs/` — Task Definitions de Fargate con sidecar Gremlin y README con pasos.
- `docs/` — Guías, escenarios y plantillas de resultados.

## Endpoints clave
- `GET /salud` — Healthcheck.
- `POST /pagar` (gateway) → reenvía a `POST /charge` (payments) con `{ "amount": 100 }`.

## Licencia
Contenido de ejemplo bajo MIT. Gremlin y Failure Flags son productos comerciales (ver su licencia y términos).
