interface IEndpoint {
  address: string;
  type: string;
  target?: string;
  user?: string;
  password?: string;
  salt?: string;
  tls_certificate?: string;
  certificate_x509_i40?: string;
}
export{IEndpoint}
