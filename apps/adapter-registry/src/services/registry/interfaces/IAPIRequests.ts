import { Identifier } from 'i40-aas-objects';

import { IStorageAdapter } from './IRegistryResultSet';



interface ICreateAdapter {
  adapterId: string;
  name?: string;
  url?: string;
  submodelId: string;
  submodelSemanticId?: string;
}

interface ICreateSubmodelEntry {
  submodelId: Identifier;
  submodelSemanticId?: string;

}

export { ICreateAdapter, ICreateSubmodelEntry };
