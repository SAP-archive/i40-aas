import { IEndpoint } from "../interfaces/IEndpoint";
import { IGenericDescriptor } from "../interfaces/IAASDescriptor";


class GenericDescriptor implements IGenericDescriptor {
  endpoints: IEndpoint[];
  signature?: string;

  constructor(
    endpoints: IEndpoint[],
    signature?: string) {

      this.endpoints = endpoints;
      if(signature) {
        this.signature = signature;
      }
  }


}

export {
  GenericDescriptor
}
