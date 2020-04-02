import { IEndpoint } from "../interfaces/IEndpoint";


interface IGenericDescriptor {
  endpoints: Array<IEndpoint>;
  certificate_x509_i40: string;
  signature: string;
}

class GenericDescriptor implements IGenericDescriptor {
  endpoints: IEndpoint[]; certificate_x509_i40: string;
  signature: string;

  constructor(endpoints: IEndpoint[],
    certificate_x509_i40: string,
    signature: string) {

      this.endpoints = endpoints;
      this.certificate_x509_i40 = certificate_x509_i40
      this.signature = signature


  }


}

export {
  IGenericDescriptor,
  GenericDescriptor
}
