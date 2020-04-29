import { iRegistry } from '../interfaces/IRegistry';
import { AssetEntity } from '../entities/AssetEntity';
import { Connection, createConnection, UpdateResult, DeleteResult, getConnection, In } from 'typeorm';
import { EndpointEntity } from '../entities/EndpointEntity';
import { AASDescriptorEntity } from '../entities/AASDescriptorEntity';
import { AASDescriptorResponse } from '../responses/AASDescriptorResponse';
import { Identifier } from '../responses/Identifier';
import { TIdType } from 'i40-aas-objects/src/types/IdTypeEnum';
import { GenericDescriptor } from '../responses/GenericDescriptor';
import { IAASDescriptor } from '../interfaces/IAASDescriptor';
import { ISemanticProtocol } from '../interfaces/ISemanticProtocol';
import { SemanticProtocolEntity } from '../entities/SemanticProtocolEntity';
import { RoleEntity } from '../entities/RoleEntity';
import { IEndpoint } from '../interfaces/IEndpoint';
import { SemanticProtocolResponse } from '../responses/SemanticProtocolResponse';
import { IRole } from '../interfaces/IRole';
import { HTTP422Error, HTTP404Error } from '../../../../utils/httpErrors';
const logger = require('aas-logger/lib/log');

class Registry implements iRegistry {

  constructor(private readonly client: Connection) {
  }
  /*
  PUT /admin/AASDescriptor/:aasId
  */
  async upsertAASDescriptor(record: IAASDescriptor): Promise<IAASDescriptor> {

    try {

      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let endpointsRepository = this.client.getRepository(EndpointEntity);
      let assetssRepository = this.client.getRepository(AssetEntity);

      //create Asset associated with this AAS
      // have seperate handlers for each entity and report errors e.g. when assetid present
      let asset = new AssetEntity();
      asset.id = record.asset.id;
      asset.idType = record.asset.idType;

      let savedAsset = await assetssRepository.save(asset);
      logger.debug("Asset Saved in Db ", asset);

      //finally create the AASDescriptor in DB
      let aasDescriptor = new AASDescriptorEntity();
      aasDescriptor.id = record.identification.id;
      aasDescriptor.idType = record.identification.idType;
      aasDescriptor.asset = record.asset;
      aasDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40;
      aasDescriptor.signature = record.descriptor.signature;

      //The Endpoints array is replaced with the one in the request. It is not possible to
      //update individual endpoints since no endpoint-id is used.
      //Thus, the client should sent the whole endpoints array every time (i.e.) first get then put

      // if no delete is done previous Endpoint record will be deleted and replaced
      // with .save() the previous stays in DB */
      record.descriptor.endpoints.map(async endpoint => {
        let deleteResult = await this.client
          .createQueryBuilder()
          .delete()
          .from(EndpointEntity)
          .where("aasdescriptor = :aasdescriptor", { aasdescriptor: record.identification.id })
          .execute();

        logger.debug("Endpoint delete result: " + deleteResult)
      })

      aasDescriptor.endpoints = record.descriptor.endpoints as EndpointEntity[]
      logger.debug("Endpoints ", aasDescriptor.endpoints);

      //Create if not exists, update if it does
      let savedAASDescriptor = await aasDescriptorRepository.save(aasDescriptor);

      logger.debug("AASDescriptor Saved in Db ", savedAASDescriptor);

      return record;
    } catch (error) {
      logger.error(error)
      throw error
    }

  }

  /**
   * Register a AASDescriptor in the db after a PUT call
   * @param record The request body
   */
  async createAASDescriptor(record: IAASDescriptor): Promise<IAASDescriptor> {

    try {

      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let assetssRepository = this.client.getRepository(AssetEntity);
      let endpointsRepository = this.client.getRepository(EndpointEntity);

      //check if the AASDescriptor is already registered in DB
      var loadedAASDescriptor = await aasDescriptorRepository.findOne({ id: record.identification.id });
      if (loadedAASDescriptor == undefined) {

        var endpointsIds = record.descriptor.endpoints.map(id => id.address)
        var types = record.descriptor.endpoints.map(type => type.type)

        //The Endpoints array is set with the one in the request. It is not possible to
        //update individual endpoints since no endpoint-id is used.
        //Thus, the client should sent the whole endpoints array every time (i.e.) first get then put
        var endpointsFound = await endpointsRepository.find({
          address: In(endpointsIds),
          type: In(types)
        })

        if (endpointsFound.length > 0) {
          throw new HTTP422Error("Duplicate Endpoint-Ids found in Database. Transaction will be cancelled ...")
        }


        //finally create the AASDescriptor in DB
        let aasDescriptor = new AASDescriptorEntity();
        aasDescriptor.id = record.identification.id;
        aasDescriptor.idType = record.identification.idType;
        aasDescriptor.asset = record.asset;
        aasDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40;
        aasDescriptor.signature = record.descriptor.signature;


        aasDescriptor.endpoints = record.descriptor.endpoints as EndpointEntity[]
        logger.debug("Endpoints ", aasDescriptor.endpoints);

        //Create if not exists, update if it does
        let savedAASDescriptor = await aasDescriptorRepository.save(aasDescriptor);

        logger.debug("AASDescriptor Saved in Db ", savedAASDescriptor);

        return record;
      }
      else {
        logger.error("Resource alredy registered in Database")
        throw new HTTP422Error("Resource alredy registered in Database");
      }
    } catch (error) {
      logger.error("Registry error caught: " + error)
      throw error;

    }

  }
  /**
   * Update a AASDescriptor Entry after a PATCH call
   * @param record
   */
  async updateAasDescriptorByAasId(record: IAASDescriptor): Promise<IAASDescriptor> {

    try {
      //find the current entry
      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let endpointsRepository = this.client.getRepository(EndpointEntity);

      //try to find the AASDescriptor in the DB
      var loadedAASDescriptor = await aasDescriptorRepository.findOne({ id: record.identification.id });
      if (loadedAASDescriptor) {

        /*NOTE: The Endpoints array is replaced with the one in the request. It is not possible to
        update individual endpoints since no endpoint-id is used.
        Thus, the client should sent the whole endpoints array every time (i.e.) first get then put
        if no delete is done previous Endpoint record will be deleted and replaced
        with .save() the previous stays in DB */
        let deleteResult = await this.client
          .createQueryBuilder()
          .delete()
          .from(EndpointEntity)
          .where("aasdescriptor = :aasdescriptor", { aasdescriptor: record.identification.id })
          .execute();

        logger.debug("Endpoint delete result: " + deleteResult)


        //after deleting existing endpoints, replace them with the new
        loadedAASDescriptor.endpoints = record.descriptor.endpoints as EndpointEntity[]
        loadedAASDescriptor.asset = record.asset;
        loadedAASDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40
        loadedAASDescriptor.signature = record.descriptor.signature
        //Create if not exists, update if it does
        let savedAasDescriptor = await aasDescriptorRepository.save(loadedAASDescriptor);

        //TODO: maybe alternative with QueryBuilder
        // let updateResult = await this.client
        // .createQueryBuilder()
        // .update(AASDescriptorEntity)
        // .set({
        //   endpoints: record.descriptor.endpoints
        // })
        // .where("id = :id", { id: record.identification.id })
        // .execute();

        logger.debug("AASDescriptor updated in Db " + JSON.stringify(savedAasDescriptor));

        return record
      }
      else {
        logger.debug("No AASDescriptor with this Id in DB " + record.identification.id)
        throw new HTTP422Error("Resource not found in Database");
      }

    } catch (error) {
      logger.debug("Error caught " + error)
      throw error;

    }

  }
  async deleteAasDescriptorByAasId(aasId: string): Promise<DeleteResult> {

    try {

      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      var aasDescriptor = await aasDescriptorRepository.delete(aasId)
      logger.debug("Affected rows: " + aasDescriptor.affected?.valueOf())

      if (aasDescriptor.affected?.valueOf() == 0) {
        throw new HTTP422Error("No Resource with this aasId found in Database: " + aasId)
      }
      // let aasDescriptor = await this.client
      //   .createQueryBuilder()
      //   .delete()
      //   .from(AASDescriptorEntity)
      //   .where("id = :id", { id: aasId })
      //   .execute();

      logger.debug("AASDescriptor deleted in Db " + JSON.stringify(aasDescriptor));


      return aasDescriptor;

    } catch (error) {
      logger.error("Error caught " + error)
      throw error;

    }

  }
  /**
   * Register a SemanticProtocol with a PUT call
   * @param record
   */
  async createSemanticProtocol(
    record: import('../interfaces/ISemanticProtocol').ISemanticProtocol
  ): Promise<ISemanticProtocol> {

    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let semProtocolRepository = this.client.getRepository(SemanticProtocolEntity);
      let rolesRepository = this.client.getRepository(RoleEntity);

      //try to find the AASDescriptor in the DB
      var loadedSemProtocol = await semProtocolRepository.findOne({ id: record.identification.id });

      if (!loadedSemProtocol) {

        //1. create a semantic protocol and save it to the DB
        let semProtocol = new SemanticProtocolEntity();
        semProtocol.id = record.identification.id;
        semProtocol.idType = record.identification.idType;
        semProtocol.roles = record.roles as RoleEntity[];

        let savedProtocol = await semProtocolRepository.save(semProtocol);
        logger.debug("SemanticProtocol Saved in Db ", savedProtocol);

        return record;
      }
      else {
        logger.error("SemanticProtocol with this ID already in Database: " + record.identification.id);
        throw new HTTP422Error("SemanticProtocol with this ID already in Database: " + record.identification.id)
      }

    } catch (error) {
      logger.error("Error caught " + error)
      throw error;
    }
  }
  async upsertSemanticProtocol(
    record: import('../interfaces/ISemanticProtocol').ISemanticProtocol
  ): Promise<ISemanticProtocol> {

    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let semProtocolRepository = this.client.getRepository(SemanticProtocolEntity);

      let semProtocol = new SemanticProtocolEntity();
      semProtocol.id = record.identification.id;
      semProtocol.idType = record.identification.idType;

      // if no delete is done previous roles record will be deleted and replaced
      // with .save() the previous stays in DB */
      let deleteResult = await this.client
        .createQueryBuilder()
        .delete()
        .from(RoleEntity)
        .where("semProtocol = :semProtocol", { semProtocol: record.identification.id })
        .execute();
      logger.debug("Role delete result: " + deleteResult)

      semProtocol.roles = record.roles as RoleEntity[];
      let savedProtocol = await semProtocolRepository.save(semProtocol);

      logger.debug("SemanticProtocol Saved in Db ", savedProtocol);

      return record;

    } catch (error) {
      logger.error("Error caught " + error)
      throw error;
    }
  }

  async deleteSemanticProtocolById(semanticProtocolId: string): Promise<DeleteResult> {
    //NOTE: the endpoints will be on delete

    try {


      let semanticProtocolRepo = this.client.getRepository(SemanticProtocolEntity);
      var deleteResult = await semanticProtocolRepo.delete(semanticProtocolId)
      logger.debug("Affected rows: " + deleteResult.affected?.valueOf())

      if (deleteResult.affected?.valueOf() == 0) {
        throw new HTTP422Error("No Resource with this SemanticProtocolId found in Database: " + semanticProtocolId)
      }

      return deleteResult;
    } catch (error) {
      logger.error("Error caught " + error)
      throw error;

    }
  }

  async readAASDescriptorByAasId(
    aasId: string
  ): Promise<IAASDescriptor> {

    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let aasAssetRepository = this.client.getRepository(AssetEntity);


      //Load the AASDescriptor object from the DB as well as the related Objects (Endpoints, Asset)
      let resultAasDescriptor = await aasDescriptorRepository.findOne({
        where: [
          { id: aasId },],
        relations: ["endpoints", "asset", "roles"]
      }) as AASDescriptorEntity;

      if (resultAasDescriptor) {
        logger.debug("asset id " + JSON.stringify(resultAasDescriptor));
        let resultAsset = await aasAssetRepository.findOne({ id: resultAasDescriptor.asset.id }) as AssetEntity
        let aasDescrIdentifier = new Identifier(resultAasDescriptor.id, resultAasDescriptor.idType as TIdType);
        let descr = new GenericDescriptor(resultAasDescriptor.endpoints, resultAasDescriptor.certificate_x509_i40, resultAasDescriptor.signature);

        let assetIdentifier = new Identifier(resultAsset.id, resultAsset.idType as TIdType);

        let response = new AASDescriptorResponse(aasDescrIdentifier, assetIdentifier, descr);
        return response;
      }
      else {
        throw new HTTP404Error("No AASDescriptor found with aasId: " + aasId);
      }
    } catch (error) {
      logger.error("Error caught " + error)
      throw error;
    }

  }

  async readAASDescriptorsBySemanticProtocolAndRole(
    sProtocol: string,
    roleName: string
  ): Promise<Array<IAASDescriptor>> {

    //Find the roles associated with the {protocolid, rolename}
    let roleIds = await this.client
      .createQueryBuilder()
      .select("role")
      .from(RoleEntity, "role")
      .where("role.name = :name", { name: roleName })
      .andWhere("role.semProtocol = :semProtocol", { semProtocol: sProtocol })
      .getMany();

    logger.debug("Roles found in Db " + JSON.stringify(roleIds));

    // Find the AASDescriptors for the given roles
    const aasDescriptorEntities = await this.client
      .getRepository(AASDescriptorEntity)
      .createQueryBuilder("aasDescriptor")
      .innerJoinAndSelect("aasDescriptor.roles", "role")
      .getMany();

    //we need only the ids from the AAS IIdentifier
    var aasIds = aasDescriptorEntities.map(identification => identification.id);
    logger.debug("AASDescriptorIds for the given roles " + JSON.stringify(aasIds));

    //get the AASDescriptorResponses (with Endpoints and Assets) to return
    //TODO: there should be maybe a more efficient way to do this (inner joins)

    var AASDescriptors = await Promise.all(
      aasIds.map(async id => {
        return await this.readAASDescriptorByAasId(id)
      }));

    logger.debug("AASDescriptorResponses for the given roles " + JSON.stringify(AASDescriptors));

    return AASDescriptors;
  }

  async readSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol> {
    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let semProtocolRepository = this.client.getRepository(SemanticProtocolEntity);

      //Load the AASDescriptor object from the DB as well as the related Objects (Endpoints, Asset)
      let resultSemanticProtocol = await semProtocolRepository.findOne({
        where: [
          { id: semanticProtocolId },],
        relations: ["roles"]
      }) as SemanticProtocolEntity;
      //if not found throw error
      if (resultSemanticProtocol) {

        let protocolIdentifier = new Identifier(resultSemanticProtocol.id, resultSemanticProtocol.idType as TIdType);
        //get the IRole Array for returning, contruct from the RoleEntity
        let rolesArr: IRole[] = resultSemanticProtocol.roles.map((roleEntity) => {
          return {
            name: roleEntity.name,
            // Get only the ids from the aasdescriptors to be returned
            aasDescriptorIds: roleEntity.aasDescriptorIds.map(aasDescriptor => {
              return new Identifier(aasDescriptor.id, aasDescriptor.idType as TIdType)
            })
          } as IRole
        });

        var response = new SemanticProtocolResponse(protocolIdentifier, rolesArr);
        return response;
        // Find the AASDescriptors for the given roles
        //TODO: this needs to be revised
        // const aasDescriptorEntities: AASDescriptorEntity[] = await this.client
        //   .getRepository(AASDescriptorEntity)
        //   .createQueryBuilder("aasDescriptor")
        //   .innerJoinAndSelect("aasDescriptor.roles", "role")
        //   .getMany();
      }
      else {
        logger.error("No Entry with this semanticProtocolId found in DB: " + semanticProtocolId)
        throw new HTTP422Error("No Entry with this semanticProtocolId found in Database")
      }
    }
    catch (error) {
      logger.error("Error caught " + error)
      throw error;

    }

  }
  async listAllSemanticProtocols(): Promise<ISemanticProtocol[]> {

    let semProtocolRepository = this.client.getRepository(SemanticProtocolEntity);
    let allProtocolsFound = await semProtocolRepository.find()
    //get only the ids of the protocols
    let ids = allProtocolsFound.map(identification => identification.id);


    var semanticProtocolsArray = await Promise.all(
      ids.map(async id => {
        return await this.readSemanticProtocolById(id)
      }));
    return semanticProtocolsArray;
  }

  async updateSemanticProtocolById(record: ISemanticProtocol): Promise<ISemanticProtocol> {
    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let semProtocolRepository = this.client.getRepository(SemanticProtocolEntity);
      //Load the AASDescriptor object from the DB as well as the related Objects (Endpoints, Asset)
      let loadedSemanticProtocol = await semProtocolRepository.findOne({ id: record.identification.id });

      if (loadedSemanticProtocol) {

        let semProtocol = new SemanticProtocolEntity();
        semProtocol.id = record.identification.id;
        semProtocol.idType = record.identification.idType;

        // if no delete is done previous roles record will be deleted and replaced
        // with .save() the previous stays in DB */
        let deleteResult = await this.client
          .createQueryBuilder()
          .delete()
          .from(RoleEntity)
          .where("semProtocol = :semProtocol", { semProtocol: record.identification.id })
          .execute();
        logger.debug("Role delete result: " + deleteResult)

        semProtocol.roles = record.roles as RoleEntity[];
        let savedProtocol = await semProtocolRepository.save(semProtocol);

        logger.debug("SemanticProtocol Saved in Db ", savedProtocol);
        return record;
      }
      else {
        logger.info("No Entry with this semanticProtocolId found in DB: " + record.identification.id)
        throw new HTTP422Error("No Entry with this semanticProtocolId found in Database")
      }
    } catch (error) {
      logger.error("Error caught " + error)
      throw error;
    }
  }

  listAllEndpoints(): Promise<IEndpoint[]> {
    throw new Error("Method not implemented.");
  }
}

export { Registry };
