import { IStorageAdapter } from "./IStorageAdapter";
import { ISubmodelEntry } from "./ISubmodelEntry";

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
  submodelIdShort: string;

  constructor(IdShort: string, adapterId?: string) {
    this.submodelIdShort = IdShort;
  }
}

class Adapter implements IStorageAdapter {
  //the submodel that the adapter can handle
  submodelId?: string;
  public adapterId: string;
  public name?: string;
  public url: string;
  constructor(
    adapterId: string,
    url: string,
    name?: string,
    submodelId?: string
  ) {
    this.url = url;
    this.adapterId = adapterId;
    this.name = name;
    this.submodelId = submodelId;
  }
}

export {
  AdapterAssignmentResultSet,
  Adapter,
  SubmodelEntry,
  IStorageAdapter,
  IAdapterAssignmentResultSet
};
