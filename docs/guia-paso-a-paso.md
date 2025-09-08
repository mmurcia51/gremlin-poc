# Guía paso a paso (Principiantes)

> **Objetivo:** ejecutar dos servicios (A=api-gateway, B=payments) y practicar Chaos Engineering con **Gremlin Agente (K8s)** y **Failure Flags (ECS)**.

---

## 1) Pre‑requisitos
- Cuenta Gremlin (trial 30 días) y credenciales de equipo (Team ID, cert/key).
- Docker y acceso a un registry (ECR para ECS; local para K8s).
- Kubernetes local (kind/minikube) o on‑prem con `kubectl` y `helm` v3.
- AWS CLI configurado para ECS Fargate.

## 2) Construir imágenes
```bash
docker build -t api-gateway:1.0.0 apps/api-gateway
docker build -t payments:1.0.0    apps/payments
```

## 3) Kubernetes (Agente)
1. `kubectl apply -f k8s/namespace.yaml`
2. Edita `k8s/deployments.yaml` y reemplaza `REPLACE_WITH_REGISTRY/...` o usa `kind load docker-image`.
3. `kubectl apply -f k8s/deployments.yaml -f k8s/services.yaml`
4. **Instalar Agente Gremlin** (Helm):
```bash
helm repo add gremlin https://helm.gremlin.com/
kubectl create namespace gremlin
# Autenticación por certificado (recomendada)
helm install gremlin gremlin/gremlin   --namespace gremlin   --set      gremlin.secret.type=certificate   --set      gremlin.secret.managed=true   --set      gremlin.hostPID=true   --set      gremlin.hostNetwork=true   --set      gremlin.secret.teamID=YOUR_TEAM_ID   --set      gremlin.secret.clusterID=YOUR_CLUSTER_ID   --set-file gremlin.secret.certificate=/ruta/gremlin.cert   --set-file gremlin.secret.key=/ruta/gremlin.key
```
5. Verifica: `kubectl -n gremlin get pods` debe mostrar `chao-*` y un `gremlin-*` por nodo.
6. `kubectl -n gremlin-workshop port-forward svc/api-gateway 3000:3000`

## 4) ECS Fargate (Failure Flags)
1. Sube imágenes a **ECR** (ver `ecs/README.md`).
2. Crea secretos en Secrets Manager: `GREMLIN_CERT`, `GREMLIN_KEY`.
3. Registra las **Task Definitions** (`ecs/taskdef-*.json`) y crea los **Services** (ALB recomendado).
4. Confirma egress TCP/443 para el sidecar hacia `api.gremlin.com`.

## 5) Probar funcionalidad base
```bash
# Gateway → Payments (vía localhost o ALB)
curl -s -X POST http://localhost:3000/pagar -H 'content-type: application/json' -d '{"amount":100}'
curl -s http://localhost:3001/salud
```

## 6) Ejecutar Experimentos

### 6.1 K8s (Agente Gremlin)
- **CPU** sobre `payments` (1 pod, 2 min).
- **Memoria** sobre `api-gateway` (50% límite, 2 min).
- **Latencia de red** entre `api-gateway` → `payments` (150–300 ms).
- **Blackhole** hacia `payments` (puerto 3001) para simular caída.

### 6.2 ECS (Failure Flags)
Crear experimentos en Gremlin → **Failure Flags**:
- **`call-b`** (gateway): efecto `{"latency": 500}` o `{"exception": "fallo en B"}`.
- **`payments-handler`** (payments): `{"exception": "error procesamiento"}`.
- **`db-query`** (payments): `{"latency":{"ms":800,"jitter":200}}`.

Usa **Service Selector** = `api-gateway` o `payments` y **Flag Selector** por nombre/labels.

## 7) Observación y análisis
- Genera carga ligera:
```bash
# 20 peticiones
for i in $(seq 1 20); do curl -s -X POST http://localhost:3000/pagar -H 'content-type: application/json' -d '{"amount":10}' | jq '.latency_ms' ; done
```
- Registra:
  - p50/p95 de `latency_ms`
  - tasa de errores (% 5xx/4xx)
  - comportamiento de health checks/ALB
  - autoscaling (si aplica)

## 8) Seguridad & buenas prácticas
- Empezar con **blast radius** pequeño (1 réplica, 1–3 min).
- Programar ventanas de pruebas y **botón Halt** a mano.
- RBAC en Gremlin: limitar quién ejecuta qué y dónde.
- No colocar credenciales en imágenes; usar Secrets Manager/Kubernetes Secrets.
- Evitar `shareProcessNamespace` salvo casos muy concretos.

## 9) Limpieza
- `helm uninstall gremlin -n gremlin && kubectl delete ns gremlin-workshop`
- Borrar services de ECS y repos ECR si no se usan.
