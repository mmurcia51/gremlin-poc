# Escenarios de caos propuestos

## 1) Falla en pasarela de pagos (ECS con Failure Flags)
- **Flag**: `call-b` (en `api-gateway`).
- **Efectos**:
  - Latencia: `{ "latency": 1000 }`
  - Error: `{ "exception": "Timeout llamando a Payments" }`
  - Combinado: `{ "latency": 2000, "exception": "Timeout + error" }`
- **Éxito esperado**: el gateway reintenta o devuelve 502/504 con mensaje claro; alertas disparan.

## 2) Falla en “BD” de pagos (ECS con Failure Flags)
- **Flag**: `db-query` (en `payments`).
- **Efectos**: latencia con jitter `{ "latency": { "ms": 800, "jitter": 200 } }` o `{ "exception": "DB error" }`.
- **Éxito esperado**: timeouts/retries controlados; límites y mensajes adecuados.

## 3) Interrupción dependencia A→B (K8s con agente)
- **Gremlin Network: Latency** entre `api-gateway` y `payments` 200–500 ms.
- **Gremlin Network: Blackhole** puerto 3001 para cortar B.
- **Éxito esperado**: circuit breaker o degradación controlada.

## 4) Pérdida de recursos (K8s con agente)
- **CPU** al 90% en `payments` 3 min.
- **Memoria** al 70–90% en `api-gateway` 3 min.
- **Éxito esperado**: sin OOM no controlados, HPA si existe, alertas y SLO protegidos.

## 5) Fallo de contenedor (K8s)
- **Shutdown / Process Killer** de `payments`.
- **Éxito esperado**: reinicio del Pod, no pérdida de datos, ALB/Service siguen verdes.
