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

/**
 * Register a storage adapter with its submodel assignment
 */
async function register(
  req: IRegisterAdapterAssignment
): Promise<IAdapterAssignmentResultSet> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();

  try {
    var result = await registryDao.registerAdapter(req);
    logger.debug(
      `Adapter ${MONGO_ADAPTER_ID} for submodel with Idshort ${MONGO_ADAPTER_SUBMODEL_ID} was stored in registry`
    );
  } catch (e) {
    throw e;
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

export { getAdaptersBySubmodelId, register };
