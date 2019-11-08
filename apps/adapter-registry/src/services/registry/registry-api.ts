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


/**
 * Register a storage adapter with its submodel assignment
 */
async function register(
  req: IRegisterAdapterAssignment
): Promise<IAdapterAssignmentResultSet> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();

  try {
    var result = await registryDao.registerAdapter(req);
    console.log('Adapter %s for submodel with ID %s was stored in registry'
    ,req.adapter.adapterId, req.submodel.submodelIdShort);
  } catch (e) {
    throw e;
  }

  return result;
}

async function readAdapterBySubmodelId(
  idShort: string
): Promise<IStorageAdapter> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  try {
    var result = await registryDao.getAdapterBySubmodelId(idShort);
    return result;
  } catch (e) {
    throw e;
  }
}

export { readAdapterBySubmodelId, register };
