import { IDatabaseClient } from './IDatabaseClient';
import { Submodel } from 'i40-aas-objects/dist/src/identifiables/Submodel';
import { Property } from 'i40-aas-objects';

import boom = require('@hapi/boom');
import { ISubmodelRecord } from '../model/ISubmodelRecord';
import { WriteOpResult } from 'mongodb';
let md5 = require('md5');

const logger = require('aas-logger/lib/log');

class SubmodelRepositoryService {
  public static KEY_PROPERTY = 'productinstanceuri';
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
      _id: id,
    });
    return stateRecord;
  }
  /*
  async getSubmodels(): Promise<ISubmodelRecord[]> {
    await this.dbClient.connect();
    return await this.dbClient.getAll();
  }
*/
  async getSubmodels(): Promise<Submodel[]> {
    await this.dbClient.connect();


    return (await this.dbClient.getAll())
      .filter((x) => x.serializedSubmodel)
      .map((x) => JSON.parse(x.serializedSubmodel));
  }


  async getSubmodel(submodelid:string): Promise<string> {
    await this.dbClient.connect();

    let equipmentDescription = md5(submodelid)
    logger.debug("submodelId: "+equipmentDescription);

    let stateRecord: ISubmodelRecord | null = await this.dbClient.getOneByKey({
      _id: equipmentDescription,
    });
    if(stateRecord){
      return stateRecord.serializedSubmodel as string;
    }
    else
    throw boom.notFound(
      'Submodel not found in Database'
    );

  }

  async createEquipmentAndSetInitialValues(
    submodel: Submodel
  ): Promise<WriteOpResult> {
    let equipmentDescription: string | undefined;
    let submodelId: string;

    try {

      submodelId = submodel.identification.id as string

      equipmentDescription = (submodel.getSubmodelElementByIdShort(
        SubmodelRepositoryService.KEY_PROPERTY
      ) as Property).value;

      logger.debug("update equipment "+submodelId)
      logger.debug("update hash "+ md5(submodelId))
    } catch (error) {
      logger.debug(error);
      throw boom.badRequest(
        'productinstanceuri needs to be defined in the provided submodel',
        error
      );
    }

    if (equipmentDescription == undefined) {
      throw boom.badRequest(
        'productinstanceuri needs to have a value in the provided submodel'
      );
    }

    let previousSubmodel: ISubmodelRecord | null = await this.getPreviousSubmodelFromDb(
      md5(submodelId)
    );
    let versionCounter = previousSubmodel ? previousSubmodel.version : 0;
    const result = await this.dbClient.update(
      {
        _id: md5(submodelId),
        version: versionCounter++,
      }, //find by
      {
        //update these
        serializedSubmodel: JSON.stringify(submodel),
      },
      true //increment version
    );
    logger.debug('db updated:' + JSON.stringify(result));
    return result;
  }
}

export { SubmodelRepositoryService };
