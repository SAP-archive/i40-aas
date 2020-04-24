import { IIdentifier } from 'i40-aas-objects';
import { IRole } from './IRole';



interface ISemanticProtocol {
  //field called protocolId in DB
  identification: IIdentifier;
  roles: IRole[];
}


export {ISemanticProtocol };
