import { IDatabaseClient } from "./IDatabaseClient";
import { Submodel } from "i40-aas-objects/dist/src/identifiables/Submodel";
import { Property } from "i40-aas-objects";
import { logger } from "../../../log";
import boom = require("@hapi/boom");
import { ISubmodelRecord } from "../model/ISubmodelRecord";
import { WriteOpResult } from "mongodb";
let md5 = require("md5");

class SubmodelRepositoryService {
  public static KEY_PROPERTY = "productinstanceuri";
  constructor(private dbClient: IDatabaseClient) {}

  async delete(id: string) {
    await this.dbClient.connect();
    return await this.dbClient.deleteOne({ _id: id });
  }

  private async getPreviousSubmodelFromDb(
    id: string
  ): Promise<ISubmodelRecord | null> {
    await this.dbClient.connect();
    let stateRecord: ISubmodelRecord | null = await this.dbClient.getOneByKey({
      _id: id
    });
    return stateRecord;
  }

  async getSubmodels(): Promise<ISubmodelRecord[]> {
    await this.dbClient.connect();
    return await this.dbClient.getAll();
  }

  async createEquipmentAndSetInitialValues(
    submodel: Submodel
  ): Promise<WriteOpResult> {
    let equipmentDescription: string | undefined;
    try {
      equipmentDescription = (submodel.getSubmodelElementByIdShort(
        SubmodelRepositoryService.KEY_PROPERTY
      ) as Property).value;
    } catch (error) {
      logger.debug(error);
      throw boom.badRequest(
        "productinstanceuri needs to be defined in the provided submodel",
        error
      );
    }

    if (equipmentDescription == undefined) {
      throw boom.badRequest(
        "productinstanceuri needs to have a value in the provided submodel"
      );
    }

    let previousSubmodel: ISubmodelRecord | null = await this.getPreviousSubmodelFromDb(
      md5(equipmentDescription)
    );
    let versionCounter = previousSubmodel ? previousSubmodel.version : 0;
    const result = await this.dbClient.update(
      {
        _id: md5(equipmentDescription),
        version: versionCounter++
      }, //find by
      {
        //update these
        serializedState: JSON.stringify(submodel)
      },
      true //increment version
    );
    logger.debug("db updated:" + JSON.stringify(result));
    return result;
  }
}

export { SubmodelRepositoryService };
