import { RegistryFactory } from "./RegistryFactory";
import { Identifier, Frame, IdTypeEnum } from "i40-aas-objects";
import {
  IAdapterAssignmentResultSet,
  AdapterAssignmentResultSet,
  Adapter,
  SubmodelEntry,
  IStorageAdapter
} from "./interfaces/IRegistryResultSet";
import { IAdapterRegistry } from "./interfaces/IAdapterRegistry";
import { logger } from "../../utils/log";
import { IRegisterAdapterAssignment } from "./interfaces/IAPIRequests";

const dotenv = require("dotenv");
dotenv.config();

let AIN_ADAPTER_ID = process.env.AIN_ADAPTER_ID;
var AIN_ADAPTER_URL = process.env.AIN_ADAPTER_URL;
var AIN_ADAPTER_SUBMODEL_ID = process.env.AIN_ADAPTER_SUBMODEL_ID;
let MONGO_ADAPTER_ID = process.env.MONGO_ADAPTER_ID;
var MONGO_ADAPTER_URL = process.env.MONGO_ADAPTER_URL;
var MONGO_ADAPTER_SUBMODEL_ID = process.env.MONGO_ADAPTER_SUBMODEL_ID;

//TODO: for now register one adapter per call, consider an array
async function preloadRegistryInitialRecords(): Promise<
  IAdapterAssignmentResultSet
> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();

  if (MONGO_ADAPTER_ID && MONGO_ADAPTER_URL && MONGO_ADAPTER_SUBMODEL_ID) {
    try {
      let adapter = new Adapter(
        MONGO_ADAPTER_ID,
        MONGO_ADAPTER_URL,
        "SAP-MongoDB-Adapter",
        MONGO_ADAPTER_SUBMODEL_ID
      );
      let submodelEntry = new SubmodelEntry(MONGO_ADAPTER_SUBMODEL_ID);

      let rrs: IRegisterAdapterAssignment = new AdapterAssignmentResultSet(
        adapter,
        submodelEntry
      );

      var result = await registryDao.registerAdapter(rrs);
      logger.debug(
        `Adapter ${MONGO_ADAPTER_ID} for submodel with Idshort ${MONGO_ADAPTER_SUBMODEL_ID} was stored in registry`
      );
    } catch (e) {
      throw e;
    }
  } else {
    logger.error(" No env variables found for ain adapter preloading");
    throw new Error(" Could not preload adapter records");
  }
  return result;
}

async function getAdaptersBySubmodelId(
  idShort: string
): Promise<Array<IStorageAdapter>> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  try {
    var result = await registryDao.listAdaptersBySubmodelID(idShort);
    return result;
  } catch (e) {
    throw e;
  }
}

export { getAdaptersBySubmodelId, preloadRegistryInitialRecords };
