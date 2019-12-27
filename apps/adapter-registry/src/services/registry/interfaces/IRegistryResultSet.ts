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
  submodelId: string;
  public adapterId: string;
  public name?: string;
  public url?: string;
  submodelSemanticId?: string;


  constructor(
    adapterId: string,
    submodelId: string,
    submodelSemanticId?: string,
    url?: string,
    name?: string,


  ) {
    this.url = url;
    this.adapterId = adapterId;
    this.name = name;
    this.submodelId = submodelId;
    this.submodelSemanticId = submodelSemanticId;
  }
}

export {
  //AdapterAssignmentResultSet,
  Adapter,
  //SubmodelEntry,
  IStorageAdapter,
 // IAdapterAssignmentResultSet
};
