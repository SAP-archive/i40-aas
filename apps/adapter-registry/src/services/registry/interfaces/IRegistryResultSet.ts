import { IStorageAdapter } from "./IStorageAdapter";

//TODO: Consider adaptations to DAOs
/*
interface IAdapterAssignmentResultSet {
  submodel: SubmodelEntry;
  adapter: Adapter;
}

class AdapterAssignmentResultSet implements IAdapterAssignmentResultSet {
  public submodel: SubmodelEntry;
  public adapter: Adapter;
  constructor(adapter: Adapter, submodel: SubmodelEntry) {
    this.submodel = submodel;
    this.adapter = adapter;
  }
}

class SubmodelEntry implements ISubmodelEntry {
  submodelId: string;
  submodelSemanticId: string;
*/
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
