import { IEndpoint } from "../interfaces/IEndpoint";
import { IGenericDescriptor } from "../interfaces/IAASDescriptor";


class GenericDescriptor implements IGenericDescriptor {
  endpoints: IEndpoint[];
  certificate_x509_i40: string;
  user: string;
  password: string;
  signature: string;
  salt?: string;

  constructor(endpoints: IEndpoint[],
    certificate_x509_i40: string,
    user: string,
    password: string,
    signature: string,
    salt?: string) {

      this.endpoints = endpoints;
      this.certificate_x509_i40 = certificate_x509_i40;
      this.user = user;
      this.password = password;
      this.signature = signature;
      if(salt) {
        this.salt = salt;
      }
  }


}

export {
  GenericDescriptor
}
