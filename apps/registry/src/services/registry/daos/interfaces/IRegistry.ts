import { Identifier } from 'i40-aas-objects';
import { RegistryResultSet, IRegistryResultSet } from './IRegistryResultSet';
import { IRegisterAas, ICreateSemanticProtocol, IRegisterRoles } from './IApiRequests';

interface iRegistry {
  readRecordByAasId(aasId: Identifier): Promise<Array<RegistryResultSet>>;
  registerAas(req: IRegisterAas): Promise<RegistryResultSet>;
  updateAas(req: IRegisterAas): Promise<RegistryResultSet>;
  deleteAasByAasId(aasId: Identifier): Promise<void>;
  listAasByAssetId(assetId: Identifier): Promise<Array<RegistryResultSet>>;
  listAas(): Promise<Array<RegistryResultSet>>;
  release(): void;
  createSemanticProtocol(req: ICreateSemanticProtocol): void;
  registerRoles(req: IRegisterRoles): void;
  readEndpointBySemanticProtocolAndRole(sProtocol: string, role: string): Promise<any>;
}

export { iRegistry };
