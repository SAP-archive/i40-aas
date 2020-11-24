<div align="center">

  ### ⚠️ **DO NOT USE ANY OF THESE FILES IN (PUBLICLY) EXPOSED SERVICES** ⚠️

</div>

<br />

## Configuration
You can enable/disable TLS entirely. It is enabled by default.

If you want to expose your service in any way and/or use it in production, definitely use your own credentials - e.g. by obtaining [Let's Encrypt certificates](https://letsencrypt.org/de/). If you already have a certificate/key pair and want to use it, you can do so for both Docker-Compose and Helm as described below.

At least use a new self-signed certificate.

#### Docker-Compose
Activate/Deactivate TLS by setting the variable `TLS_ENABLED` in the `.env` file to `true`/`false` (default `true`).

To use custom credentials, place them in the `src/compose/volumes/certs/` dir (which is mounted to `/etc/ssl/certs/` for all serving applications) and change the respective path within the `.env` variables. These are the defaults:
  - `TLS_KEYFILE=/etc/ssl/certs/i40-aas.key.pem`
  - `TLS_CERTFILE=/etc/ssl/certs/i40-aas.crt.pem`

#### Helm
Activate/Deactivate TLS by setting the variable `security.tls.enabled` in the `values.yaml` file of the [Helm chart](https://github.com/SAP/i40-aas/tree/master/helm/i40-aas) to `true`/`false` (default `false`).

Add your credentials as a *secret* to the cluster where you want to deploy the i40-aas Helm chart: 
```bash
kubectl create secret generic YOUR-SECRET -n YOUR-NAMESPACE --from-file=i40-aas.crt.pem --from-file=i40-aas.key.pem
```
Then, in the `values.yaml`, set the variable `security.certificates.secretName` to the name of the secret you just created. 

If you change the name of the certificate or key file in the process, then adapt the values `security.tls.keyfile` or `security.tls.crtfile` in the `values.yaml` accordingly.  
**BEWARE**: By doing so, you **MUST NOT** modify the path of the certificate/key files in these variables as that is hardcoded in the chart templates **!**  


## Create your own self-signed crt/key via openssl
Adjust the configuration in `i40-aas.conf` to your needs and run:
```bash
openssl req -config i40-aas.conf -new -x509 -newkey rsa:2048 -nodes -keyout i40-aas.key.pem -days 3650 -out i40-aas.crt.pem
```

Verify your certificate using:
```bash
openssl x509 -in i40-aas.crt.pem -text -noout
```
