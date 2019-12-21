import { Identifier } from 'i40-aas-objects';

import { Adapter, SubmodelEntry } from './IRegistryResultSet';

interface IRegisterAdapterAssignment {
  submodel: SubmodelEntry;
  adapter: Adapter;
}


interface ICreateAdapter {
  submodelId?: string;
  submodelSemanticId?: string;

  adapter: Adapter;
}

interface ICreateSubmodelEntry {
  submodelId: Identifier;
  submodelSemanticId?: string;

}

export { IRegisterAdapterAssignment, ICreateAdapter, ICreateSubmodelEntry };
