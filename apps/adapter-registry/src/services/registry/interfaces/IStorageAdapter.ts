import { Identifier } from "i40-aas-objects";


export interface IStorageAdapter {
  adapterid: string;
  name?: string;
  url?: string;
  submodelid: string;
  submodelsemanticid?: string;
}
