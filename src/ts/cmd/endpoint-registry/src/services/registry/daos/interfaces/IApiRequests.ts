import { IIdentifier } from 'i40-aas-objects';
import { IEndpoint } from './IEndpoint';

interface IAASDescriptor {
  identification: IIdentifier;
  asset:IIdentifier;
  descriptor:GenericDescriptor;
}

interface GenericDescriptor {
  endpoints: Array<IEndpoint>;
  certificate_x509_i40: string;
  signature: string;
}



interface ICreateSemanticProtocol {
  //field called protocolId in DB
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
  IAASDescriptor ,
  ICreateSemanticProtocol,
  IAssignRoles,
  ICreateRole,
  ICreateAsset,
  GenericDescriptor
};
