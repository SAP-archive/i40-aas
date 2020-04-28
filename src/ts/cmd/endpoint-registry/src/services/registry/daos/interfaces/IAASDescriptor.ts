import { IIdentifier } from "i40-aas-objects";
import { IEndpoint } from "./IEndpoint";

interface IAASDescriptor {
  identification: IIdentifier;
  asset:IIdentifier;
  descriptor:IGenericDescriptor;
}




interface IGenericDescriptor {
  endpoints: Array<IEndpoint>;
  certificate_x509_i40: string;
  signature: string;
}

export{IAASDescriptor, IGenericDescriptor}
