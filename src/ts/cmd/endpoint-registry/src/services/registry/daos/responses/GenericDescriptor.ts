import { IEndpoint } from "../interfaces/IEndpoint";
import { IGenericDescriptor } from "../interfaces/IAASDescriptor";


class GenericDescriptor implements IGenericDescriptor {
  endpoints: IEndpoint[];
  certificate_x509_i40: string;
  signature: string;
  user?: string;
  password?: string;
  salt?: string;

  constructor(endpoints: IEndpoint[],
    certificate_x509_i40: string,
    signature: string,
    user?: string,
    password?: string,
    salt?: string) {

      this.endpoints = endpoints;
      this.certificate_x509_i40 = certificate_x509_i40;
      this.signature = signature;

      if(user) {
        this.user = user;
      }
      if(password) {
        this.password = password;
      }
      if(salt) {
        this.salt = salt;
      }
  }


}

export {
  GenericDescriptor
}
