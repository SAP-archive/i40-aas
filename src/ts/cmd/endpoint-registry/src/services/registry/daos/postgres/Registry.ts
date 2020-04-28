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
  async upsertAASDescriptor(record: IAASDescriptor): Promise<IAASDescriptor | undefined> {

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

      aasDescriptor.endpoints = record.descriptor.endpoints as EndpointEntity[]
      logger.debug("Endpoints ", aasDescriptor.endpoints);

      //Create if not exists, update if it does
      let savedAASDescriptor = await aasDescriptorRepository.save(aasDescriptor);

      logger.debug("AASDescriptor Saved in Db ", savedAASDescriptor);

      return record;
    } catch (error) {
      logger.error(error)
      return undefined
    }

  }


  /**
   * Register a AASDescriptor in the db after a PUT call
   * @param record The request body
   */
  async createAASDescriptor(record: IAASDescriptor): Promise<IAASDescriptor | undefined> {

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
        record.descriptor.endpoints.map(async endpoint => {
          let deleteResult = await this.client
            .createQueryBuilder()
            .delete()
            .from(EndpointEntity)
            .where("aasdescriptor = :aasdescriptor", { aasdescriptor: record.identification.id })
            .execute();

          logger.debug("Endpoint delete result: " + deleteResult)
        })

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
  async deleteAasDescriptorByAasId(aasId: string): Promise<DeleteResult | undefined> {

    try {

      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      var aasDescriptor = await (await aasDescriptorRepository.delete(aasId))
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

  async createSemanticProtocol(
    record: import('../interfaces/ISemanticProtocol').ISemanticProtocol
  ): Promise<ISemanticProtocol> {

    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let semProtocolRepository = this.client.getRepository(SemanticProtocolEntity);
      let rolesRepository = this.client.getRepository(RoleEntity);

      //1. create a semantic protocol and save it to the DB
      let semProtocol = new SemanticProtocolEntity();
      semProtocol.id = record.identification.id;
      semProtocol.idType = record.identification.idType;
      let savedProtocol = await semProtocolRepository.save(semProtocol);
      logger.debug("SemanticProtocol Saved in Db ", savedProtocol);

      //2. create Roles associated with this semanticProtocol
      // have seperate handlers for each entity and report errors e.g. when assetid present

      await Promise.all(
        record.roles.map(async role => {
          let rE = new RoleEntity();
          rE.semProtocol = semProtocol; //many to one relation
          rE.name = role.name;
          rE.id = rE.name.concat('-').concat(rE.semProtocol.id); //combination should be unique

          await rolesRepository.save({ id: rE.id, name: rE.name, semProtocol: rE.semProtocol });
          logger.debug("Role Saved in Db ", rE);


          //TODO: for the case of upsert find out how to avoid the contraint errors for the relation

          //3. for each role assign a the role to a AASDescriptor, docu see here, https://github.com/typeorm/typeorm/blob/master/docs/relational-query-builder.md
          //we need only the ids from the AAS IIdentifier
          var aasIds = role.aasDescriptorIds.map(identification => identification.id);
          logger.debug("AAS Ids ", JSON.stringify(aasIds));

          await Promise.all(
            aasIds.map(async id => {
              await this.client
                .createQueryBuilder()
                .relation(AASDescriptorEntity, "roles")
                .of(id)
                .add(rE.id);
            }));
        })
      );

      return record;

    } catch (error) {
      logger.error("Error caught " + error)
      throw error;
    }
  }


  async deleteSemanticProtocolById(semanticProtocolId: string): Promise<DeleteResult> {
    //NOTE: the endpoints will be on delete

    let aasDescriptor = await this.client
      .createQueryBuilder()
      .delete()
      .from(SemanticProtocolEntity)
      .where("id = :id", { id: semanticProtocolId })
      .execute();

    logger.debug("SemanticProtocol deleted in Db " + JSON.stringify(aasDescriptor));

    return aasDescriptor;
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
        relations: ["endpoints", "asset"]
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
      let rolesRepository = this.client.getRepository(RoleEntity);

      //Load the AASDescriptor object from the DB as well as the related Objects (Endpoints, Asset)
      let resultSemanticProtocol = await semProtocolRepository.findOne({
        where: [
          { id: semanticProtocolId },],
        relations: ["roles"]
      }) as SemanticProtocolEntity;

      // Find the AASDescriptors for the given roles
      //TODO: this needs to be revised
      const aasDescriptorEntities = await this.client
        .getRepository(AASDescriptorEntity)
        .createQueryBuilder("aasDescriptor")
        .innerJoinAndSelect("aasDescriptor.roles", "role")
        .getMany();


      logger.debug("Descriptors loaded  " + JSON.stringify(aasDescriptorEntities))

      // Find the AASDescriptors for the given roles

      //get the IRole Array for returning, contruct from the RoleEntity
      let rolesArr: IRole[] = resultSemanticProtocol.roles.map((roleEntity) => {
        return {
          name: roleEntity.name,
          aasDescriptorIds: aasDescriptorEntities
        } as IRole
      });
      let protocolIdentifier = new Identifier(resultSemanticProtocol.id, resultSemanticProtocol.idType as TIdType);
      logger.debug("Roles  " + JSON.stringify(rolesArr))

      var response = new SemanticProtocolResponse(protocolIdentifier, rolesArr);

      return response;

    } catch (error) {
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


  updateSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol> {
    logger.error("Tried to insert an already registered endpoint in Database")
    throw new Error("Method not implemented.");
  }


  listAllEndpoints(): Promise<IEndpoint[]> {
    throw new Error("Method not implemented.");
  }
}

export { Registry };
