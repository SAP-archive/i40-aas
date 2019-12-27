import { Identifier } from 'i40-aas-objects';

import { IStorageAdapter } from './IRegistryResultSet';



interface ICreateAdapter {
  adapter: IStorageAdapter;
}

interface ICreateSubmodelEntry {
  submodelId: Identifier;
  submodelSemanticId?: string;

}

export { ICreateAdapter, ICreateSubmodelEntry };
