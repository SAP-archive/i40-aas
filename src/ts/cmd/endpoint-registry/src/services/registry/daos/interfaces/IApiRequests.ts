import { IIdentifier } from 'i40-aas-objects';
import { IGenericDescriptor } from '../responses/GenericDescriptor';

interface IAASDescriptor {
  identification: IIdentifier;
  asset:IIdentifier;
  descriptor:IGenericDescriptor;
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
};
