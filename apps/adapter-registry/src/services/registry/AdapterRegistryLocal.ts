import { IAdapterRegistry } from "./interfaces/IAdapterRegistry";
import {
  IAdapterAssignmentResultSet,
  AdapterAssignmentResultSet,
  Adapter,
  IStorageAdapter
} from "./interfaces/IRegistryResultSet";
import { Identifier } from "i40-aas-objects";
import { IRegisterAdapterAssignment } from "./interfaces/IAPIRequests";
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
  ): Promise<AdapterAssignmentResultSet[]> {
    throw new Error("Method not implemented.");
  }

  async registerAdapter(
    record: import("./interfaces/IAPIRequests").IRegisterAdapterAssignment
  ): Promise<AdapterAssignmentResultSet> {
    try {
      //since submodel to Adapter is 1..1 we use the submodelid as key
      const insertAdapterResult = await this.storage.setItem(
        record.submodel.submodelIdShort,
        record.adapter
      );
    } catch (e) {
      logger.error(
        "Error storing adapter entry " + record.submodel.submodelIdShort
      );
      throw e;
    }
    logger.info("Registed record: " + record);
    return record;
  }

  updateAdapter(
    req: import("./interfaces/IAPIRequests").ICreateAdapter
  ): Promise<AdapterAssignmentResultSet> {
    throw new Error("Method not implemented.");
  }
  deleteAdapterByAdapterID(aasId: Identifier): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getAdapterBySubmodelId(submodelId: string): Promise<IStorageAdapter> {
    try {
      //find which keys contain the submodel id
      let adapter = await this.storage.get(submodelId);

      if (adapter) {
        logger.debug("Adapter found : " + JSON.stringify(adapter));

        return adapter;
      } else {
        logger.debug("No adapter for submodel : " + submodelId);

        return new Adapter();
      }
    } catch (e) {
      throw new Error("internal storage error");
    }
    //return [new AdapterAssignmentResultSet({ id: aasRecord.aasId, idType: aasRecord.idType }, endpoints, { id: '123', idType: IdTypeEnum.Custom })];
  }
  listAllSubmodels(): Promise<AdapterAssignmentResultSet[]> {
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
  registerAdapterAssignment(req: IRegisterAdapterAssignment): void {
    throw new Error("Method not implemented.");
  }
}

export { AdapterRegistryLocal as Registry };
