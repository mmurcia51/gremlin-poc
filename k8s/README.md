# Kubernetes (Agente Gremlin)

1) Cargar imágenes al cluster (local: `kind load docker-image`, o usar un registry).
2) `kubectl apply -f k8s/namespace.yaml`
3) `kubectl apply -f k8s/deployments.yaml`
4) `kubectl apply -f k8s/services.yaml`
5) Verifica: `kubectl -n gremlin-workshop get pods,svc`
6) Port-forward para pruebas locales:
   - `kubectl -n gremlin-workshop port-forward svc/api-gateway 3000:3000`
   - `kubectl -n gremlin-workshop port-forward svc/payments 3001:3001`

## Instalar Agente Gremlin (Helm)
Consulta `docs/guia-paso-a-paso.md` para el comando `helm install` con `hostPID` y `hostNetwork`.
