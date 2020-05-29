## DISCLAIMER
:warning: __DO NOT USE ANY OF THESE FILES IN AN (PUBLICLY) EXPOSED SERVICE AND/OR IN PRODUCTION__ :warning:

## Configuration
You can enable/disable TLS entirely by setting the following to anything but `true`. These are the defaults:
- `CORE_INGRESS_GRPC_TLS_ENABLE=true`
- `CORE_EGRESS_GRPC_TLS_ENABLE=true`
- `CORE_INGRESS_HTTP_TLS_ENABLE=true`
- `CORE_EGRESS_HTTP_TLS_ENABLE=true`

If you have your own certificate/key pair and want to use it for GRPC/HTTP you can do so for both Docker-Compose and Helm.

#### Docker-Compose
Place them in the `src/compose/volumes/certs/` dir (which is mounted to `/certs/` for both ingresses) and change the respective path settings within the `.env`. These are the defaults:
  - `CORE_INGRESS_GRPC_TLS_KEYFILEPATH=/certs/server.key`
  - `CORE_INGRESS_GRPC_TLS_CRTFILEPATH=/certs/server.crt`
  - `CORE_INGRESS_HTTP_TLS_KEYFILEPATH=/certs/server.key`
  - `CORE_INGRESS_HTTP_TLS_CRTFILEPATH=/certs/server.crt`

#### Helm
Mount your files into the corresponding Pods for cluster usage by adjusting the corresponding Kubernetes Deployments and then adjust the environment values by modifying the `values.yaml` file.

## Create your own self-signed crt/key via openssl
If you want to expose your service in any way and/or use it in production, definitely generate your own credentials. For new self-signed certificates adjust the configuration in `server.conf` to your needs before running:
```bash
openssl req -config server.conf -new -x509 -newkey rsa:2048 -nodes -keyout server.key -days 3650 -out server.crt
```

Verify your certificate using:
```bash
openssl x509 -in server.crt -text -noout
```
