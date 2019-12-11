import { Identifier } from 'i40-aas-objects';
import { RegistryResultSet, IRegistryResultSet } from './IRegistryResultSet';
import { IRegisterAas, ICreateSemanticProtocol , ICreateRole, IAssignRoles } from './IApiRequests';
import { ICreateRoleResultSet } from './IRegistryRolesSet';

interface iRegistry {
  readRecordByAasId(aasId: Identifier): Promise<Array<RegistryResultSet>>;
  registerAas(req: IRegisterAas): Promise<RegistryResultSet>;
  updateAas(req: IRegisterAas): Promise<RegistryResultSet>;
  deleteAasByAasId(aasId: Identifier): Promise<number>;
  listAasByAssetId(assetId: Identifier): Promise<Array<RegistryResultSet>>;
  listAas(): Promise<Array<RegistryResultSet>>;
  listAllEndpoints(): Promise<Array<RegistryResultSet>>;
  release(): void;
  createSemanticProtocol(req: ICreateSemanticProtocol): void;
  assignRoles(req: IAssignRoles): void;
  createRole(req:ICreateRole):Promise<ICreateRoleResultSet>;
  readEndpointBySemanticProtocolAndRole(sProtocol: string, role: string): Promise<any>;
}

export { iRegistry };
