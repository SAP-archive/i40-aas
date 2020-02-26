import { TIdType } from 'i40-aas-objects/src/types/IdTypeEnum';
import { TTarget } from './IRegistryResultSet';

interface IJointRecord {
  assetIdType: string;
  assetId: string;
  aasId: string;
  aasIdType: TIdType;
  target: TTarget;
  protocol_name: string;
  protocol_version: string;
  URL: string;
  roleId: string;
}
interface IEndpointRecord {
  endpointId: string;
  URL: string;
  target: TTarget;
  protocol_name: string;
  protocol_version?: string;
  aasId: string;
}
export { IJointRecord, IEndpointRecord };
