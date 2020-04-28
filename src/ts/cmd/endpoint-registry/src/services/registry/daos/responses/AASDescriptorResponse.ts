import { IIdentifier } from "i40-aas-objects";
import { GenericDescriptor } from "./GenericDescriptor";
import { IAASDescriptor } from "../interfaces/IAASDescriptor";


class AASDescriptorResponse implements IAASDescriptor {
  identification: IIdentifier;
  asset: IIdentifier ;
  descriptor: GenericDescriptor;


  constructor(identification: IIdentifier, asset: IIdentifier, descriptor: GenericDescriptor) {
    this.asset = asset;
    this.descriptor = descriptor;
    this.identification = identification;
  }

}

export { AASDescriptorResponse }
