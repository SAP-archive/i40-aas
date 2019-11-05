import { Identifier } from 'i40-aas-objects';

import { Endpoint } from './IRegistryResultSet';

interface IRegisterAas {
  aasId: Identifier;
  endpoints: Array<Endpoint>;
  assetId: Identifier;
}

interface ICreateSemanticProtocol {
  semanticProtocol: string;
  roles: Array<string>;
}
interface IRegisterRoles {
  aasId: Identifier;
  roles: Array<string>;
}

export { IRegisterAas, ICreateSemanticProtocol, IRegisterRoles };
