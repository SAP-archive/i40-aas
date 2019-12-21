import { Identifier } from "i40-aas-objects";


export interface IStorageAdapter {
  adapterId: string;
  name?: string;
  url?: string;
  submodelId: string;
  submodelSemanticId?: string;
}
