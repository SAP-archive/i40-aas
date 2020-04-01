import { IIdentifier } from 'i40-aas-objects';
import { RegistryResultSet, IRegistryResultSet } from './IRegistryResultSet';
import {
  IAASDescriptor,
  ICreateSemanticProtocol,
  ICreateRole,
  IAssignRoles,
  ICreateAsset
} from './IApiRequests';
import { ICreateRoleResultSet } from './IRegistryRolesSet';

interface iRegistry {
  readRecordByAasId(aasId: IIdentifier): Promise<Array<RegistryResultSet>>;
  registerAas(req: IAASDescriptor): Promise<void>;
  updateAas(req: IAASDescriptor): Promise<RegistryResultSet>;
  deleteAasByAasId(aasId: IIdentifier): Promise<number>;
  listAasByAssetId(assetId: IIdentifier): Promise<Array<RegistryResultSet>>;
  listAas(): Promise<Array<RegistryResultSet>>;
  listAllEndpoints(): Promise<Array<RegistryResultSet>>;
  release(): void;
  createSemanticProtocol(req: ICreateSemanticProtocol): void;
  assignRoles(req: IAssignRoles): void;
  createRole(req: ICreateRole): Promise<ICreateRoleResultSet>;
  readEndpointBySemanticProtocolAndRole(
    sProtocol: string,
    role: string
  ): Promise<any>;
  createAsset(req: ICreateAsset): Promise<ICreateAsset>;
}

export { iRegistry };
