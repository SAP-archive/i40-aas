import { RegistryFactory } from "./RegistryFactory";
import { Identifier, Frame, IdTypeEnum } from "i40-aas-objects";
import {
  Adapter,
  IStorageAdapter
} from "./interfaces/IRegistryResultSet";
import { IAdapterRegistry } from "./interfaces/IAdapterRegistry";
import { logger } from "../../utils/log";
import { ICreateAdapter } from "./interfaces/IAPIRequests";

const dotenv = require("dotenv");
dotenv.config();

/**
 * Register a storage adapter with its submodel assignment
 */
async function createAdapters(
  req: ICreateAdapter[]
): Promise<IStorageAdapter[]> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  var adaptersArray: IStorageAdapter[]= new Array();
  req.forEach(async entry => {
  try {
    var adapter = await registryDao.createAdapter(entry);
    adaptersArray.push(adapter);
    logger.info(
      `Adapter ${entry.adapterId} for submodel with ID ${entry.submodelId} was stored in registry`
    );
  } catch (e) {
    throw e;
  }
});
  return adaptersArray;
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
  createAdapters,
  clearAllEntries
};
