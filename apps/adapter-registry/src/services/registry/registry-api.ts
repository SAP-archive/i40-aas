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
async function createAdapter(
  req: IRegisterAdapterAssignment
): Promise<IAdapterAssignmentResultSet> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();

  try {
    var result = await registryDao.createAdapter(req);
    logger.info(
      `Adapter ${req.adapter.adapterId} for submodel with ID ${req.submodel.submodelId} was stored in registry`
    );
  } catch (e) {
    throw e;
  }

  return result;
}

async function getAdapterBySubmodelId(
  submodelId: string
): Promise<IStorageAdapter> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  try {
    var result = await registryDao.getAdapterBySubmodelId(submodelId);
    return result;
  } catch (e) {
    throw e;
  }
}
async function getAdapterBysubmodelSemanticId(
  submodelSemanticId: string
): Promise<IStorageAdapter> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  try {
    var result = await registryDao.getAdapterBySubmodelSemanticId(
      submodelSemanticId
    );
    return result;
  } catch (e) {
    throw e;
  }
}

async function clearAllEntries(): Promise<string> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  try {
    var result = await registryDao.clearAll();
  } catch (e) {
    throw e;
  }
  return "OK";
}

export {
  getAdapterBySubmodelId, getAdapterBysubmodelSemanticId,
  createAdapter,
  clearAllEntries
};
