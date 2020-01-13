import { Identifier } from 'i40-aas-objects';

import { IStorageAdapter } from './IRegistryResultSet';



interface ICreateAdapter {
  adapterid: string;
  name?: string;
  url?: string;
  submodelid: string;
  submodelsemanticid?: string;
}

interface ICreateSubmodelEntry {
  submodelid: Identifier;
  submodelsemanticid?: string;

}

export { ICreateAdapter, ICreateSubmodelEntry };
