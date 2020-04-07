import { IIdentifier } from "i40-aas-objects";
import { TIdType } from "i40-aas-objects/dist/src/types/IdTypeEnum";

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
