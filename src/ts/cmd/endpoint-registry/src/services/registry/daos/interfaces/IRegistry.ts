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
import { AASDescriptorResponse } from '../responses/AASDescriptorResponse';
import { DeleteResult } from 'typeorm';

interface iRegistry {
  readAASDescriptorByAasId(aasId: string): Promise<IAASDescriptor|undefined>;
  registerAas(req: IAASDescriptor): Promise<IAASDescriptor | undefined>;
  updateAasDescriptorByAasId(req: IAASDescriptor): Promise<IAASDescriptor | undefined>;
  deleteAasDescriptorByAasId(aasId: string): Promise<DeleteResult|undefined>;
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
