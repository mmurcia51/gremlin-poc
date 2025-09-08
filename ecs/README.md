# ECS Fargate (Failure Flags)

## Resumen
- Construye y sube imágenes a ECR.
- Crea secretos en Secrets Manager para `GREMLIN_TEAM_CERTIFICATE` y `GREMLIN_TEAM_PRIVATE_KEY`.
- Registra las **Task Definitions** incluidas aquí (edita ARNs/IDs).
- Crea **Services** detrás de un **ALB** con health checks `/salud`.

## ECR (ejemplo)
```bash
AWS_REGION=us-east-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
for svc in api-gateway payments; do
  aws ecr create-repository --repository-name $svc --region $AWS_REGION || true
  docker build -t $svc:1.0.0 apps/$svc
  docker tag $svc:1.0.0 $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$svc:1.0.0
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
  docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$svc:1.0.0
done
```

## Secrets Manager (ejemplo)
```bash
aws secretsmanager create-secret --name GREMLIN_CERT --secret-string "-----BEGIN CERTIFICATE-----..."
aws secretsmanager create-secret --name GREMLIN_KEY  --secret-string "-----BEGIN EC PRIVATE KEY-----..."
```

## Registrar Task Definitions
Edita los archivos `ecs/taskdef-*.json` (roles, región, repos, ARNs) y registra:
```bash
aws ecs register-task-definition --cli-input-json file://ecs/taskdef-gateway.json
aws ecs register-task-definition --cli-input-json file://ecs/taskdef-payments.json
```

## Crear Services (GUI recomendada)
- Crea un **VPC** con subnets públicas y privadas.
- Crea un **ALB** público que enrute a `api-gateway:3000` y otro target group para `payments:3001` (opcional).
- Health check: `/salud` (HTTP 200).
- **Fargate**: `awsvpc`, security group con salida TCP 443 (Gremlin API) y 80/443 según tráfico.
```bash
# Ejemplo mínimo por CLI (sin ALB) para validar rápidamente:
aws ecs create-cluster --cluster-name gremlin-lab
SUBNETS="subnet-xxx,subnet-yyy"
SG="sg-zzz"
aws ecs create-service   --cluster gremlin-lab   --service-name payments-svc   --task-definition gremlin-payments   --desired-count 1   --launch-type FARGATE   --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=ENABLED}"

aws ecs create-service   --cluster gremlin-lab   --service-name gateway-svc   --task-definition gremlin-gateway   --desired-count 1   --launch-type FARGATE   --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=ENABLED}"
```
