import { ISemanticProtocol } from "../postgres/ISemanticProtocol";
import { IRole } from "../interfaces/IRole";
import { IIdentifier } from "i40-aas-objects";

class SemanticProtocolResponse implements ISemanticProtocol {
  identification: IIdentifier;
  roles: IRole[];

  constructor(identifier:IIdentifier, rolesArr:Array<IRole>){
    this.identification = identifier;
    this.roles = rolesArr;
  }

}

export {SemanticProtocolResponse}
