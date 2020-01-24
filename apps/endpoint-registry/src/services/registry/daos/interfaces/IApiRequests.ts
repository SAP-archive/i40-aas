import { Identifier } from 'i40-aas-objects';

import { Endpoint } from './IRegistryResultSet';

interface IRegisterAas {
  aasId: Identifier;
  endpoints: Array<Endpoint>;
  assetId: Identifier;
}

interface ICreateSemanticProtocol {
  semanticProtocol: string;
}
interface ICreateRole {
  roleId: string;
  semanticProtocol: string;
}

interface IAssignRoles {
  aasId: Identifier;
  roleId: string;
}

interface ICreateAsset {
  assetId: Identifier;
}

export {
  IRegisterAas,
  ICreateSemanticProtocol,
  IAssignRoles,
  ICreateRole,
  ICreateAsset
};
