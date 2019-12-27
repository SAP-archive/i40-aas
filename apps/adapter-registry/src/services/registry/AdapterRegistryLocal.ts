import { IAdapterRegistry } from "./interfaces/IAdapterRegistry";
import {
  Adapter,
  IStorageAdapter
} from "./interfaces/IRegistryResultSet";
import { Identifier } from "i40-aas-objects";
import * as logger from "winston";

/**
 * This class implements the IAdapterRegistry to store the registry entries in
 * a local key-value store
 */
class AdapterRegistryLocal implements IAdapterRegistry {
  async clearAll(): Promise<void> {
    try {
      await this.storage.clear();
    } catch (e) {
      logger.error("Error clearing the registry local storage ");
      throw e;
    }
  }
  storage: any;

  constructor(client: any) {
    this.storage = client;
  }

  async readAdapterRecordByID(
    adapterId: Identifier
  ): Promise<IStorageAdapter[]> {
    throw new Error("Method not implemented.");
  }

  async createAdapter(
    record: import("./interfaces/IAPIRequests").ICreateAdapter
  ): Promise<IStorageAdapter> {
    try {
      //the adapter.id is used as key
      if (record.adapter.adapterId) {
        const insertAdapterResult = await this.storage.setItem(
          record.adapter.adapterId,
          record.adapter
        );
      }
    } catch (e) {
      logger.error("Error storing adapter entry " + record.adapter.adapterId);
      throw e;
    }
    logger.info("Registed record: " + JSON.stringify(record));
    return record.adapter;
  }

  updateAdapter(
    req: import("./interfaces/IAPIRequests").ICreateAdapter
  ): Promise<IStorageAdapter> {
    throw new Error("Method not implemented.");
  }
  deleteAdapterByAdapterID(aasId: Identifier): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getAdapterBySubmodelId(submodelId: string): Promise<IStorageAdapter> {
    try {
      //find which entries contain the submodel id
      var adapter;

      //TODO: there should be a better way to model the adapter in the key value store
      //the requirement that submodelid could be empty means that it cannot be used as key

      let values: Adapter[] = await this.storage.values();

      values.forEach(Adapter => {
        logger.debug("Adapter found : " + JSON.stringify(Adapter));
        if (Adapter.submodelId === submodelId) {
          adapter = Adapter;
          //TODO: check for singularity. Submodel is an 1..1 to Adapter
        }
      });

      if (adapter) {
        logger.debug("Adapter found : " + JSON.stringify(adapter));

        return adapter;
      } else {
        logger.debug("No adapter for submodel : " + submodelId);

        return Adapter.prototype;
      }
    } catch (e) {
      throw new Error("internal storage error");
    }
  }

  async getAdapterBySubmodelSemanticId(
    submodelSemanticId: string
  ): Promise<IStorageAdapter> {
    try {
      //find which entries contain the submodel id
      var adapter;
      //TODO: there should be a better way to model the adapter in the key value store
      //the requirement that submodelid could be empty means that it cannot be used as key

      let values: Adapter[] = await this.storage.values();
      values.forEach(Adapter => {
        logger.debug("Adapter found : " + JSON.stringify(Adapter));
        if (Adapter.submodelSemanticId === submodelSemanticId) {
          adapter = Adapter;
          //TODO: check for singularity. Submodel is an 1..1 to Adapter
        }
      });

      if (adapter) {
        logger.debug("Adapter found : " + JSON.stringify(adapter));

        return adapter;
      } else {
        logger.debug("No adapter for submodelSemanticId : " + submodelSemanticId);

        return Adapter.prototype;
      }
    } catch (e) {
      throw new Error("internal storage error");
    }
  }

  listAllSubmodels(): Promise<IStorageAdapter[]> {
    throw new Error("Method not implemented.");
  }
  release(): void {
    throw new Error("Method not implemented.");
  }
  createSubmodel(
    req: import("./interfaces/IAPIRequests").ICreateSubmodelEntry
  ): void {
    throw new Error("Method not implemented.");
  }
  /* TODO: consider if we need to have seperate DAOs for adapter and assignment
  registerAdapterAssignment(req: IRegisterAdapterAssignment): void {
    throw new Error("Method not implemented.");
  }
  */
}

export { AdapterRegistryLocal as Registry };
