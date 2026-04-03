# Container & Kubernetes Hardening

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Audit Level: 3 | Automation: Partial (Trivy, Checkov, kube-bench; network policies manual)

---

## Docker - Secure Dockerfile Patterns

### Run as non-root

```dockerfile
# Vulnerable - runs as root by default
FROM node:20
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "server.js"]

# Safe - create a dedicated non-root user
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --chown=node:node . .
USER node          # switch to non-root before CMD
CMD ["node", "server.js"]
```

### Multi-stage build - minimize attack surface

```dockerfile
# Build stage - has dev tools, compilers, test deps
FROM golang:1.22 AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o app .

# Final stage - only the binary, no build tools
FROM gcr.io/distroless/static-debian12
COPY --from=builder /build/app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]
```

### Read-only filesystem

```yaml
# docker-compose
services:
  app:
    image: myapp:latest
    read_only: true
    tmpfs:
      - /tmp          # writable temp dir if needed
    volumes:
      - ./uploads:/app/uploads   # only the directories that need writes
```

### Never do this

```yaml
# Vulnerable docker-compose
services:
  app:
    privileged: true          # full host access - almost never needed
    volumes:
      - /:/host               # entire host filesystem
      - /var/run/docker.sock:/var/run/docker.sock  # docker socket = full host control
    network_mode: host        # bypasses network isolation
```

---

## Image Scanning

```bash
# Trivy - scan image before pushing
trivy image --severity CRITICAL,HIGH myapp:latest

# Fail CI if critical CVEs found
trivy image --exit-code 1 --severity CRITICAL myapp:latest

# Scan Dockerfile for misconfigs
trivy config --severity HIGH,CRITICAL Dockerfile

# GitHub Actions integration
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    severity: CRITICAL,HIGH
    exit-code: 1
```

---

## Kubernetes - Pod Security

### Pod Security Standards (replaces PodSecurityPolicy)

```yaml
# Apply restricted policy to a namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted
```

### Secure Pod spec

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
        seccompProfile:
          type: RuntimeDefault    # applies default seccomp profile

      containers:
      - name: app
        image: myapp:sha256@abc123  # pin to digest, not tag
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]          # drop all Linux capabilities
        resources:
          limits:
            cpu: "500m"
            memory: "256Mi"        # prevents resource exhaustion
          requests:
            cpu: "100m"
            memory: "128Mi"
        volumeMounts:
        - name: tmp
          mountPath: /tmp          # writable tmpdir if needed
      volumes:
      - name: tmp
        emptyDir: {}
      automountServiceAccountToken: false  # disable unless needed
```

---

## Kubernetes - Network Policies

By default, all pods can communicate with all other pods. Network policies implement micro-segmentation.

```yaml
# Deny all ingress and egress by default in a namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}        # applies to all pods
  policyTypes:
  - Ingress
  - Egress
---
# Allow the app to receive traffic only from the ingress controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-app
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
---
# Allow the app to reach only the database, nothing else
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-app-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - ports:              # allow DNS
    - protocol: UDP
      port: 53
```

---

## Kubernetes - Secrets Management

Kubernetes Secrets are base64-encoded by default, not encrypted. Do not store sensitive secrets as raw K8s Secrets in production.

### Encryption at rest

```yaml
# Enable encryption at rest for Secrets in the API server
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64-encoded-32-byte-key>
  - identity: {}
```

### Preferred: External Secrets Operator

Sync secrets from AWS Secrets Manager / GCP Secret Manager / Vault into K8s Secrets automatically:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: myapp-secrets          # creates a K8s Secret
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: myapp/prod/db-url
  - secretKey: OPENAI_API_KEY
    remoteRef:
      key: myapp/prod/openai-key
```

### Vault Agent Injector

```yaml
# Annotations on Pod to inject Vault secrets as files
annotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: "myapp"
  vault.hashicorp.com/agent-inject-secret-db: "secret/myapp/db"
  vault.hashicorp.com/agent-inject-template-db: |
    {{- with secret "secret/myapp/db" -}}
    DATABASE_URL={{ .Data.data.url }}
    {{- end }}
```

---

## RBAC in Kubernetes

```yaml
# Create a minimal role for a service account
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: myapp-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
  resourceNames: ["myapp-config"]    # only this specific configmap
# no secrets access, no pod exec, no anything else
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: myapp-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: myapp-sa
  namespace: production
roleRef:
  kind: Role
  name: myapp-role
  apiGroup: rbac.authorization.k8s.io
```

---

## Admission Controllers

Admission controllers enforce policies before resources are created in the cluster.

```bash
# Kyverno - policy engine for K8s
kubectl apply -f https://github.com/kyverno/kyverno/releases/latest/download/install.yaml

# Example policy: require non-root containers
cat <<EOF | kubectl apply -f -
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-non-root
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-runAsNonRoot
    match:
      resources:
        kinds: [Pod]
    validate:
      message: "Containers must not run as root."
      pattern:
        spec:
          containers:
          - securityContext:
              runAsNonRoot: true
EOF
```

---

## Image Provenance and Signing

```bash
# Sign image with Cosign (Sigstore)
cosign sign --key cosign.key myregistry/myapp:v1.0.0

# Verify before deployment
cosign verify --key cosign.pub myregistry/myapp:v1.0.0

# Kyverno policy: require signed images
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-signed-images
spec:
  validationFailureAction: Enforce
  rules:
  - name: verify-image-signature
    match:
      resources:
        kinds: [Pod]
    verifyImages:
    - image: "myregistry/*"
      key: "cosign.pub"
```

---

## Audit Commands

```bash
# kube-bench - CIS Kubernetes Benchmark
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
kubectl logs -l app=kube-bench

# Checkov - scan K8s manifests
checkov -d ./k8s --framework kubernetes

# Trivy - scan cluster for misconfigs
trivy k8s --report=summary cluster

# kubescape - NSA/CISA hardening guidance
kubescape scan framework nsa
```

---

## Checklist

| Check | Expected |
|-------|----------|
| Containers run as non-root user | Yes |
| Root filesystem is read-only | Yes |
| All Linux capabilities dropped | Yes |
| No privileged containers | Yes |
| Resource limits set (CPU and memory) | Yes |
| Network policies: default deny, explicit allow | Yes |
| Pod security standard: restricted | Yes (production namespace) |
| K8s Secrets encrypted at rest | Yes |
| Secrets from external vault, not raw K8s Secrets | Yes (production) |
| ServiceAccount token auto-mount disabled | Yes (where not needed) |
| RBAC: minimal roles, no cluster-admin for workloads | Yes |
| Images pinned to digest, not mutable tag | Yes |
| Images signed and signature verified on admission | Yes |
| kube-bench CIS findings addressed | Level 1 minimum |
