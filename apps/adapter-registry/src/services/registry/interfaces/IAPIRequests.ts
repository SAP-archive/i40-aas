import { IIdentifier } from 'i40-aas-objects';



interface ICreateAdapter {
  adapterid: string;
  name?: string;
  url?: string;
  submodelid: string;
  submodelsemanticid?: string;
}

interface ICreateSubmodelEntry {
  submodelid: IIdentifier;
  submodelsemanticid?: string;

}

export { ICreateAdapter, ICreateSubmodelEntry };
