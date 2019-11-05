import { Identifier } from 'i40-aas-objects';

import { Adapter, SubmodelEntry } from './IRegistryResultSet';

interface IRegisterAdapterAssignment {
  submodel: SubmodelEntry;
  adapter: Adapter;
}


interface ICreateAdapter {
  submodelIdShort?: string;
  adapter: Adapter;
}

interface ICreateSubmodelEntry {
  submodelId: Identifier;
}

export { IRegisterAdapterAssignment, ICreateAdapter, ICreateSubmodelEntry };
