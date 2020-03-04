import { TIdType } from 'i40-aas-objects/src/types/IdTypeEnum';

interface IJointRecord {
  assetIdType: string;
  assetId: string;
  aasId: string;
  aasIdType: TIdType;
  target: string;
  protocol_name: string;
  protocol_version: string;
  URL: string;
  roleId: string;
}
interface IEndpointRecord {
  endpointId: string;
  URL: string;
  target: string;
  protocol_name: string;
  protocol_version?: string;
  aasId: string;
}
export { IJointRecord, IEndpointRecord };
