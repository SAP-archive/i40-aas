import { IIdentifier } from 'i40-aas-objects';

import { Endpoint } from './IRegistryResultSet';

interface IRegisterAas {
  aasId: IIdentifier;
  endpoints: Array<Endpoint>;
  assetId: IIdentifier;
}

interface ICreateSemanticProtocol {
  semanticProtocol: string;
}
interface ICreateRole {
  roleId: string;
  semanticProtocol: string;
}

interface IAssignRoles {
  aasId: IIdentifier;
  roleId: string;
}

interface ICreateAsset {
  assetId: IIdentifier;
}

export {
  IRegisterAas,
  ICreateSemanticProtocol,
  IAssignRoles,
  ICreateRole,
  ICreateAsset
};
