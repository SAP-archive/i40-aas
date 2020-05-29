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
import { IIdentifier } from 'i40-aas-objects';
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
      logger.debug("Endpoints are:  " + JSON.stringify(aasDescriptor.endpoints));

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

      //check if the AASDescriptor is already registered in DB
      var loadedAASDescriptor = await aasDescriptorRepository.findOne({ id: record.identification.id });
      if (loadedAASDescriptor == undefined) {

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
        logger.info("Resource alredy registered in Database")
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

      //try to find the AASDescriptor in the DB
      var loadedAASDescriptor = await aasDescriptorRepository.findOne({ id: record.identification.id },{ relations: ["endpoints","asset"] });
      if (loadedAASDescriptor) {

        /*NOTE: The Endpoints array is replaced with the one in the request. It is not possible to
        update individual endpoints since no endpoint-id is used.
        Thus, the client should sent the whole endpoints array every time (i.e.) first get then put
        if no delete is done previous Endpoint record will be deleted and replaced
        with .save() the previous stays in DB */

        var deleted = await aasDescriptorRepository.delete(record.identification.id)
   //let softRemoveResult  = await this.client.manager.softRemove(loadedAASDescriptor.endpoints);
        logger.debug("Endpoint delete result: " + JSON.stringify(deleted) )
        //TODO: the endpoints that are not anymore assigned to an AASDescriptor should be deleted from DB

        // loadedAASDescriptor.endpoints = record.descriptor.endpoints.filter(endpoint => {
        //   endpoint.address !== endpoint.address }) as EndpointEntity[];

        loadedAASDescriptor.endpoints = record.descriptor.endpoints as EndpointEntity[]
        loadedAASDescriptor.asset = record.asset;
        loadedAASDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40
        loadedAASDescriptor.signature = record.descriptor.signature
        //Create if not exists, update if it does
        let savedAasDescriptor = await aasDescriptorRepository.save(loadedAASDescriptor);



        logger.debug("AASDescriptor updated in Db " + JSON.stringify(savedAasDescriptor));

        return record
      }
      else {
        logger.info("No AASDescriptor with this Id in DB " + record.identification.id)
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

      //try to find the AASDescriptor in the DB
      var loadedSemProtocol = await semProtocolRepository.findOne({ id: record.identification.id });

      if (!loadedSemProtocol) {

        //create a semantic protocol and save it to the DB
        let semProtocol = new SemanticProtocolEntity();
        semProtocol.id = record.identification.id;
        semProtocol.idType = record.identification.idType;
        semProtocol.roles = record.roles as RoleEntity[];

        let savedProtocol = await semProtocolRepository.save(semProtocol);
        logger.debug("SemanticProtocol Saved in Db ", savedProtocol);

        return record;
      }
      else {
        logger.info("SemanticProtocol with this ID already in Database: " + record.identification.id);
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
      logger.debug("Role delete result: " + JSON.stringify(deleteResult))

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
          { id: aasId }],
        relations: ["endpoints", "asset", "roles"]
      }) as AASDescriptorEntity;

      if (resultAasDescriptor) {
        logger.debug("asset id " + JSON.stringify(resultAasDescriptor));

        //the auto generated Ids are not to be returned in the endpoint object
       // resultAasDescriptor.endpoints.map(endpoint => delete endpoint.id)

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
        logger.info("No Entry with this semanticProtocolId found in DB: " + semanticProtocolId)
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

  async readAASDescriptorsBySemanticProtocolAndRole(
    semanticProtocolId: string,
    roleName: string
  ): Promise<Array<IAASDescriptor>> {

    try {
      //get an Entityrepository for the AASDescriptor and the Roles
      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let rolesRepo = this.client.getRepository(RoleEntity);

      let loadedRole = await rolesRepo.findOne({
        where: [
          { semProtocol: semanticProtocolId, name: roleName }],
        relations: ["aasDescriptorIds"]
      })
      if (!loadedRole) {
        throw new HTTP422Error(`No Role found for the protocol ${semanticProtocolId} with
        name ${roleName}`)  }

//TODO: need a test for this
      if(loadedRole.aasDescriptorIds.length === 0){
        logger.info(" No AASIDs for this role found ");
        return [];
      }
      loadedRole.aasDescriptorIds.forEach(id => {
        logger.debug("Found Role "+JSON.stringify(loadedRole?.name) + " with AASId "+ JSON.stringify(id.id))

      });

      //we need to return a list of AASDescriptor Objects
      //find the aasIds associated with the role
      let aasIds = loadedRole.aasDescriptorIds.map(identifier => identifier.id)

      //load the AASDescriptorEntities from the Database
      let AASDescriptorEntitiesArray = await aasDescriptorRepository
      .find({where: [{ id: In(aasIds)}], relations: ["endpoints", "asset"]});

      //For each entity we need to construct a IAASDescriptor Object
      if (AASDescriptorEntitiesArray) {

        var AASDescriptorArr = AASDescriptorEntitiesArray.map((aasDescrEntity) => {
          let aasDescrIdentifier = new Identifier(aasDescrEntity.id, aasDescrEntity.idType as TIdType);
          let descr = new GenericDescriptor(aasDescrEntity.endpoints, aasDescrEntity.certificate_x509_i40, aasDescrEntity.signature);
          let assetIdentifier = new Identifier(aasDescrEntity.asset.id, aasDescrEntity.asset.idType as TIdType);
          let response = new AASDescriptorResponse(aasDescrIdentifier, assetIdentifier, descr);
          return response as IAASDescriptor
        });
        return AASDescriptorArr;
      }
      else {
        throw new HTTP404Error("No AASDescriptors found for the role " + roleName);
      }
    }
    catch (error) {
      throw error;
    }

  }

  async updateAASDescriptorsToRole(sProtocol: string, roleName: string, aasIds: IIdentifier[]): Promise<IRole> {
    try {
      //find the role
      let loadedRole = await getConnection().getRepository(RoleEntity).findOne({
        where: [
          { semProtocol: sProtocol, name: roleName }],
        relations: ["aasDescriptorIds"]
      })
      if (loadedRole) {
        logger.debug("Role found " + JSON.stringify(loadedRole))
        // logger.debug("Old role AAS "+ JSON.stringify(loadedRole.aasDescriptorIds))

        //find the AASDescriptors based on the ids to update the role
        let AASDescriptorEntitiesArray = await this.client.getRepository(AASDescriptorEntity)
          .find({ id: In(aasIds.map(identification => identification.id)) });

        logger.debug("AAS found " + JSON.stringify(AASDescriptorEntitiesArray))

        if (AASDescriptorEntitiesArray.length < aasIds.length) {
          logger.info(" One or more of the provided AAS Ids does not exist in Database")
          throw new HTTP422Error(" One or more of the provided AAS Ids does not exist in Database")
        }

        loadedRole.aasDescriptorIds = AASDescriptorEntitiesArray;
        // logger.debug("Updated role  "+ JSON.stringify(loadedRole))

        //save the updated role
        await this.client.getRepository(RoleEntity).save(loadedRole);

        return loadedRole as IRole
      }
      else {
        throw new HTTP422Error("No Role found for this protocol and role name")
      }
    }
    catch (error) {
      throw error;
    }
  }
  async deleteAASIdFromRole(sProtocol: string, roleName: string, aasIdToRemove: string): Promise<IRole> {
    try {
      //find the role
      logger.debug("AAS ID to remove "+aasIdToRemove)
      let loadedRole = await getConnection().getRepository(RoleEntity).findOne({
        where: [
          { semProtocol: sProtocol, name: roleName }],
        relations: ["aasDescriptorIds"]
      })
      if (loadedRole) {
       // logger.debug("Role found " + JSON.stringify(loadedRole))

       // logger.debug("Old role AASs "+ JSON.stringify(loadedRole.aasDescriptorIds))

        loadedRole.aasDescriptorIds = loadedRole.aasDescriptorIds.filter(function (aasDescriptor)  {
         return  aasDescriptor.id !== aasIdToRemove})

        // logger.debug("Updated aasIds  "+ JSON.stringify(loadedRole.aasDescriptorIds))

        //save the updated role
        await this.client.getRepository(RoleEntity).save(loadedRole);

        return loadedRole as IRole
      }
      else {
        throw new HTTP422Error("No Role found for this protocol and role name")
      }
    }
    catch (error) {
      throw error;
    }  }




  listAllEndpoints(): Promise<IEndpoint[]> {
    throw new Error("Method not implemented.");
  }
}

export { Registry };

