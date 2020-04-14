import { TIdType } from "i40-aas-objects/src/types/IdTypeEnum";
import { IIdentifier } from "i40-aas-objects";

class Identifier implements IIdentifier
{
  id: string;
  idType: TIdType


  constructor(id:string, idType:TIdType){
    this.id = id;
    this.idType = idType;
  }
}
export {Identifier}
