# SimC-Free Helm chart

The chart deploys the SimC-Free container as a Kubernetes Deployment and
ClusterIP Service. It can optionally expose the service through Kubernetes
Ingress, Gateway API `HTTPRoute`, or both. Both routes are disabled by default.

## Install

```bash
helm upgrade --install sim-free ./helm/sim-free \
  --namespace sim-free --create-namespace
```

The default image is `alexohneander/sim-free:latest`. Override it for a
different registry or a pinned release:

```bash
helm upgrade --install sim-free ./helm/sim-free \
  --namespace sim-free --create-namespace \
  --set image.repository=registry.example.com/sim-free \
  --set image.tag=1.0.0
```

## Kubernetes Ingress

Install an Ingress controller first, then configure the hostname, class, and
TLS secret in [examples/ingress-values.yaml](./examples/ingress-values.yaml):

```bash
helm upgrade --install sim-free ./helm/sim-free \
  --namespace sim-free --create-namespace \
  --values ./helm/sim-free/examples/ingress-values.yaml
```

The example uses the `nginx` class and expects the `sim-free-tls` Secret to
exist in the release namespace. Adjust both to match your cluster.

## Gateway API

Install the Gateway API CRDs and a compatible Gateway controller first. Then
set `gateway.parentRefs` to an existing Gateway and listener and configure the
hostname in [examples/gateway-values.yaml](./examples/gateway-values.yaml):

```bash
helm upgrade --install sim-free ./helm/sim-free \
  --namespace sim-free --create-namespace \
  --values ./helm/sim-free/examples/gateway-values.yaml
```

The referenced Gateway listener must allow routes from the release namespace.
The chart creates an `HTTPRoute` and does not create or manage a Gateway.

Ingress and Gateway API can be enabled independently or at the same time. The
service remains internal (`ClusterIP`) in every mode.

## Configuration

| Value | Default | Description |
| --- | --- | --- |
| `replicaCount` | `1` | Number of application pods |
| `image.repository` | `alexohneander/sim-free` | Container image |
| `image.tag` | `latest` | Container image tag |
| `service.port` | `8000` | Application and service port |
| `ingress.enabled` | `false` | Create a `networking.k8s.io/v1` Ingress |
| `gateway.enabled` | `false` | Create a Gateway API `HTTPRoute` |
| `resources` | `{}` | Kubernetes container resource requests and limits |

See [values.yaml](./values.yaml) for all supported settings.
