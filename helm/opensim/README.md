# OpenSim Helm chart

The chart deploys the OpenSim web application, simulation workers, and a
persistent Redis instance. The web application and workers share Redis-backed
jobs and reports; completed reports are retained for 24 hours. The chart can
optionally expose the web service through Kubernetes Ingress, Gateway API
`HTTPRoute`, or both. Both routes are disabled by default.

## Install

```bash
helm upgrade --install opensim ./helm/opensim \
  --namespace opensim --create-namespace
```

The default image is `ghcr.io/alexohneander/opensim:latest`, published by the
GitHub Actions workflow. Make the GHCR package public for unauthenticated
cluster pulls, or configure `imagePullSecrets` for a private package. Override
the image for a different registry or a pinned release:

```bash
helm upgrade --install opensim ./helm/opensim \
  --namespace opensim --create-namespace \
  --set image.repository=registry.example.com/opensim \
  --set image.tag=1.0.0
```

The chart provisions Redis with append-only persistence and a persistent
volume claim. Set `redis.persistence.storageClassName` and `redis.persistence.size`
to match your cluster. For an externally managed Redis, disable the bundled
instance and provide its connection URL:

```bash
helm upgrade --install opensim ./helm/opensim \
  --namespace opensim --create-namespace \
  --set redis.enabled=false \
  --set-string redis.url=rediss://user:password@redis.example.com:6379/0
```

The default `worker.replicaCount` is 2. Each worker executes one simulation at
a time; adjust the replica count and worker resource requests for the available
CPU capacity. Redis uses `noeviction` so memory pressure produces an explicit
enqueue failure rather than silently dropping queued jobs. Ensure Redis has
enough memory for queued profiles and reports.

## Kubernetes Ingress

Install an Ingress controller first, then configure the hostname, class, and
TLS secret in [examples/ingress-values.yaml](./examples/ingress-values.yaml):

```bash
helm upgrade --install opensim ./helm/opensim \
  --namespace opensim --create-namespace \
  --values ./helm/opensim/examples/ingress-values.yaml
```

The example uses the `nginx` class and expects the `opensim-tls` Secret to
exist in the release namespace. Adjust both to match your cluster.

## Gateway API

Install the Gateway API CRDs and a compatible Gateway controller first. Then
set `gateway.parentRefs` to an existing Gateway and listener and configure the
hostname in [examples/gateway-values.yaml](./examples/gateway-values.yaml):

```bash
helm upgrade --install opensim ./helm/opensim \
  --namespace opensim --create-namespace \
  --values ./helm/opensim/examples/gateway-values.yaml
```

The referenced Gateway listener must allow routes from the release namespace.
The chart creates an `HTTPRoute` and does not create or manage a Gateway.

Ingress and Gateway API can be enabled independently or at the same time. The
service remains internal (`ClusterIP`) in every mode.

## Configuration

| Value | Default | Description |
| --- | --- | --- |
| `replicaCount` | `1` | Number of application pods |
| `worker.replicaCount` | `2` | Number of simulation workers; each processes one job at a time |
| `image.repository` | `ghcr.io/alexohneander/opensim` | Container image |
| `image.tag` | `latest` | Container image tag |
| `service.port` | `8000` | Application and service port |
| `redis.enabled` | `true` | Deploy the chart-managed Redis instance |
| `redis.url` | `""` | Redis connection URL override or external Redis URL |
| `redis.persistence.enabled` | `true` | Persist the Redis append-only data |
| `redis.persistence.size` | `1Gi` | Redis persistent volume claim size |
| `ingress.enabled` | `false` | Create a `networking.k8s.io/v1` Ingress |
| `gateway.enabled` | `false` | Create a Gateway API `HTTPRoute` |
| `resources` | `{}` | Kubernetes container resource requests and limits |

See [values.yaml](./values.yaml) for all supported settings.
