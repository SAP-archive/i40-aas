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
TODO

## Create your own self-signed crt/key via openssl
Adjust the configuration in `i40-aas.conf` to your needs and run:
```bash
openssl req -config i40-aas.conf -new -x509 -newkey rsa:2048 -nodes -keyout i40-aas.key.pem -days 3650 -out i40-aas.crt.pem
```

Verify your certificate using:
```bash
openssl x509 -in i40-aas.crt.pem -text -noout
```
