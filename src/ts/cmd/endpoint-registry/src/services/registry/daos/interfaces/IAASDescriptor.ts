import { IIdentifier } from "i40-aas-objects";
import { IEndpoint } from "./IEndpoint";

interface IAASDescriptor {
  identification: IIdentifier;
  asset:IIdentifier;
  descriptor:IGenericDescriptor;
}

interface IGenericDescriptor {
  endpoints: Array<IEndpoint>;
  signature?: string;
}

export{IAASDescriptor, IGenericDescriptor}
