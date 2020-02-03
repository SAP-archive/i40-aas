import { IdTypeEnum } from "i40-aas-objects";

//TODO: check if there is a better way to achieve this (given that enum is const)
function convertToIdTypeEnum(enumAsString:string ):IdTypeEnum{

  switch(enumAsString) {
    case "Custom": {
       return IdTypeEnum.Custom;
       break;
    }
    case "IRDI": {
      return IdTypeEnum.IRDI;
      break;
    }
    case "IRI": {
      return IdTypeEnum.IRI;
      break;
    }
    case "IdShort": {
      return IdTypeEnum.IdShort;
      break;
    }
    //TODO: check if this is valid. It is implemeted like this in routes
    default:{
      return IdTypeEnum.Custom;
    }
  }
}

export {convertToIdTypeEnum}

