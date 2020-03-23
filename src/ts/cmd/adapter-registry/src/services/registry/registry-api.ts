import { RegistryFactory } from "./RegistryFactory";
import { IStorageAdapter } from "./interfaces/IRegistryResultSet";
import { IAdapterRegistry } from "./interfaces/IAdapterRegistry";
import { ICreateAdapter } from "./interfaces/IAPIRequests";

const dotenv = require('dotenv');
dotenv.config();

/**
 * Register a storage adapter with its submodel assignment
 */
async function createAdapters(
  req: ICreateAdapter[]
): Promise<IStorageAdapter[]> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();

  //use map() to async call all the adapters
  var adaptersArray = req.map(async val => {
    return await registryDao.createAdapter(val);
  });

  return Promise.all(adaptersArray);
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
async function listAllAdapters(): Promise<Array<IStorageAdapter>> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  return registryDao.listAllAdapters();
}
async function clearAllEntries(): Promise<string> {
  var registryDao: IAdapterRegistry = await RegistryFactory.getRegistryLocal();
  try {
    var result = await registryDao.clearAll();
  } catch (e) {
    throw e;
  }
  return 'OK';
}

export {
  getAdapterBySubmodelId,
  getAdapterBysubmodelSemanticId,
  createAdapters,
  clearAllEntries,
  listAllAdapters
};
