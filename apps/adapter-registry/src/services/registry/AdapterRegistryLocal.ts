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
      const insertSubmodelResult = await this.storage.setItem(
        record.submodel.submodelIdShort,
        record.submodel
      );
    } catch (e) {
      throw e;
    }

    try {
      const insertAdapterResult = await this.storage.setItem(
        record.adapter.adapterId,
        record.adapter
      );
    } catch (e) {
      throw e;
    }
    logger.info("Registerd record: " + record);
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
  async listAdaptersBySubmodelID(
    submodelId: string
  ): Promise<IStorageAdapter[]> {
    //get all entries with a key that includes "adapter"
    //TODO:naming convention for adapter-ids should be kept for this schema to work. Consider looking thourhg all keys for adapters
    /*
    this.storage.forEach(async function(callback) {
    // callback: look for adapters
});
    */
    var aaRS: Adapter[] = new Array<Adapter>();

    try{
    //find which keys contain adapters
    let values: Adapter[] = await this.storage.valuesWithKeyMatch(/adapter/); //output: [{name: "Bruce Wayne"},{name: "Clark Kent"}]

    values.forEach(Adapter => {
      logger.debug("Adapter found : " + JSON.stringify(Adapter));
      if (Adapter.submodelId === submodelId) {
        aaRS.push(Adapter);
      }
    });

    return aaRS;
  }
  catch(e){
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
