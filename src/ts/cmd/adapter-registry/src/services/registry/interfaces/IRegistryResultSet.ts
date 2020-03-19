import { IStorageAdapter } from "./IStorageAdapter";

//TODO: Consider adaptations to DAOs

class Adapter implements IStorageAdapter {
  //the submodel that the adapter can handle
  submodelid: string;
  public adapterid: string;
  public name?: string;
  public url?: string;
  submodelsemanticid?: string;


  constructor(
    adapterid: string,
    submodelid: string,
    submodelsemanticid?: string,
    url?: string,
    name?: string,


  ) {
    this.url = url;
    this.adapterid = adapterid;
    this.name = name;
    this.submodelid = submodelid;
    this.submodelsemanticid = submodelsemanticid;
  }
}

export {
  //AdapterAssignmentResultSet,
  Adapter,
  //SubmodelEntry,
  IStorageAdapter,
 // IAdapterAssignmentResultSet
};
