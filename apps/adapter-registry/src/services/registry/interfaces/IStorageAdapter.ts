import { Identifier } from "i40-aas-objects";


export interface IStorageAdapter {
  adapterId: string;
  name?: string;
  url: string;
  //TODO: should it be Identifier? IdShort is string
  submodelId?: string;
}
