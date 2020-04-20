import { iRegistry } from '../interfaces/IRegistry';
import { AssetEntity } from '../entities/AssetEntity';
import { Connection, createConnection, UpdateResult, DeleteResult, getConnection } from 'typeorm';
import { EndpointEntity } from '../entities/EndpointEntity';
import { AASDescriptorEntity } from '../entities/AASDescriptorEntity';
import { AASDescriptorResponse } from '../responses/AASDescriptorResponse';
import { Identifier } from '../responses/Identifier';
import { TIdType } from 'i40-aas-objects/src/types/IdTypeEnum';
import { GenericDescriptor } from '../responses/GenericDescriptor';
import { IAASDescriptor } from '../interfaces/IAASDescriptor';
import { ISemanticProtocol } from './ISemanticProtocol';
import { SemanticProtocolEntity } from '../entities/SemanticProtocolEntity';
import { RoleEntity } from '../entities/RoleEntity';
import { IEndpoint } from '../interfaces/IEndpoint';
import { SemanticProtocolResponse } from '../responses/SemanticProtocolResponse';
import { IRole } from '../interfaces/IRole';
import { HTTP422Error, HTTP404Error } from '../../../../utils/httpErrors';
import { logger } from '../../../../utils/log';

class Registry implements iRegistry {




  updateSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol> {
    throw new Error("Method not implemented.");
  }


  listAllEndpoints(): Promise<IEndpoint[]> {
    throw new Error("Method not implemented.");
  }
  constructor(private readonly client: Connection) {
  }

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
      console.log("Asset Saved in Db ", asset);


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
      console.log("Endpoints ", aasDescriptor.endpoints);

      //Create if not exists, update if it does
      let savedAASDescriptor = await aasDescriptorRepository.save(aasDescriptor);

      console.log("AASDescriptor Saved in Db ", savedAASDescriptor);

      return record;
    } catch (error) {
      console.log(error)
      return undefined
    }

  }



  async createAASDescriptor(record: IAASDescriptor): Promise<IAASDescriptor | undefined> {

    try {

      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let assetssRepository = this.client.getRepository(AssetEntity);

      //check if the AASDescriptor is already registered in DB
      var loadedAASDescriptor = await aasDescriptorRepository.findOne({id:record.identification.id});
      if(loadedAASDescriptor == undefined){

      //create Asset associated with this AAS
      // have seperate handlers for each entity and report errors e.g. when assetid present
      let asset = new AssetEntity();
      asset.id = record.asset.id;
      asset.idType = record.asset.idType;

      let savedAsset = await assetssRepository.save(asset);
      console.log("Asset Saved in Db ", asset);


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
      console.log("Endpoints ", aasDescriptor.endpoints);

      //Create if not exists, update if it does
      let savedAASDescriptor = await aasDescriptorRepository.save(aasDescriptor);

      console.log("AASDescriptor Saved in Db ", savedAASDescriptor);

      return record;
      }
      else{
        console.log("Resource alredy registered in Database")
        throw new HTTP422Error("Resource alredy registered in Database");
      }
    } catch (error) {
      console.log("Registry error caught: " + error)
      throw error;

    }

  }

  async updateAasDescriptorByAasId(record: IAASDescriptor): Promise<IAASDescriptor> {

    try {
      //we need the current
      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);

      //try to find the AASDescriptor in the DB
      var loadedAASDescriptor = await aasDescriptorRepository.findOne({id:record.identification.id});
      if(loadedAASDescriptor){

      //The Endpoints array is replaced with the one in the request. It is not possible to
      //update individual endpoints since no endpoint-id is used.
      //Thus, the client should sent the whole endpoints array every time (i.e.) first get then put
      console.debug("Updating Endpoints ... ");

        loadedAASDescriptor.endpoints = record.descriptor.endpoints as EndpointEntity[]
        loadedAASDescriptor.asset = record.asset;
        loadedAASDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40
        loadedAASDescriptor.signature = record.descriptor.signature
           //Create if not exists, update if it does
        let savedAasDescriptor = await aasDescriptorRepository.save(loadedAASDescriptor);

      //TODO: maybe do this with a .save as above?
      console.debug("Updating Descriptor ... ");

      /* alternative to updating
      let aasDescriptor = await this.client
        .createQueryBuilder()
        .update(AASDescriptorEntity)
        .set({
          certificate_x509_i40: record.descriptor.certificate_x509_i40,
          signature: record.descriptor.signature
        })
        .where("id = :id", { id: record.identification.id })
        .execute();
        */

      console.log("AASDescriptor updated in Db " + JSON.stringify(savedAasDescriptor));

      return record
    }
    else{ console.log("No AASDescriptor with this Id in DB "+record.identification.id)
      throw new HTTP422Error("Resource not found in Database");
    }

    } catch (error) {
      console.log("Error caught " + error)
      throw error;

    }

  }
  async deleteAasDescriptorByAasId(aasId: string): Promise<DeleteResult | undefined> {

    try {
      let aasDescriptor = await this.client
        .createQueryBuilder()
        .delete()
        .from(AASDescriptorEntity)
        .where("id = :id", { id: aasId })
        .execute();

      console.log("AASDescriptor deleted in Db " + JSON.stringify(aasDescriptor));


      return aasDescriptor;

    } catch (error) {
      console.log("Error caught " + error)
      throw error;

    }

  }

  async createSemanticProtocol(
    record: import('./ISemanticProtocol').ISemanticProtocol
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
      console.log("SemanticProtocol Saved in Db ", savedProtocol);

      //2. create Roles associated with this semanticProtocol
      // have seperate handlers for each entity and report errors e.g. when assetid present

      await Promise.all(
        record.roles.map(async role => {
          let rE = new RoleEntity();
          rE.semProtocol = semProtocol; //many to one relation
          rE.name = role.name;
          rE.id = rE.name.concat('-').concat(rE.semProtocol.id); //combination should be unique

          await rolesRepository.save({ id: rE.id, name: rE.name, semProtocol: rE.semProtocol });
          console.log("Role Saved in Db ", rE);


          //TODO: for the case of upsert find out how to avoid the contraint errors for the relation

          //3. for each role assign a the role to a AASDescriptor, docu see here, https://github.com/typeorm/typeorm/blob/master/docs/relational-query-builder.md
          //we need only the ids from the AAS IIdentifier
          var aasIds = role.aasDescriptorIds.map(identification => identification.id);
          console.log("AAS Ids ", JSON.stringify(aasIds));

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
      console.log("Error caught " + error)
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

    console.log("SemanticProtocol deleted in Db " + JSON.stringify(aasDescriptor));

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

      if(resultAasDescriptor) {
      console.debug("asset id " + JSON.stringify(resultAasDescriptor));
      let resultAsset = await aasAssetRepository.findOne({ id: resultAasDescriptor.asset.id }) as AssetEntity
      let aasDescrIdentifier = new Identifier(resultAasDescriptor.id, resultAasDescriptor.idType as TIdType);
      let descr = new GenericDescriptor(resultAasDescriptor.endpoints, resultAasDescriptor.certificate_x509_i40, resultAasDescriptor.signature);

      let assetIdentifier = new Identifier(resultAsset.id, resultAsset.idType as TIdType);

      let response = new AASDescriptorResponse(aasDescrIdentifier, assetIdentifier, descr);
      return response;
      }
      else{
        throw new HTTP404Error("No AASDescriptor found with aasId: "+ aasId);
      }



    } catch (error) {
      console.log("Error caught " + error)
      throw error;
    }

  }


  async readAASDescriptorsBySemanticProtocolAndRole(
    sProtocol: string,
    roleName: string
  ): Promise<Array<IAASDescriptor>> {

    console.log("Try getting roleIds");


    //Find the roles associated with the {protocolid, rolename}
    let roleIds = await this.client
      .createQueryBuilder()
      .select("role")
      .from(RoleEntity, "role")
      .where("role.name = :name", { name: roleName })
      .andWhere("role.semProtocol = :semProtocol", { semProtocol: sProtocol })
      .getMany();

    console.log("Roles found in Db " + JSON.stringify(roleIds));

    // Find the AASDescriptors for the given roles
    const aasDescriptorEntities = await this.client
      .getRepository(AASDescriptorEntity)
      .createQueryBuilder("aasDescriptor")
      .innerJoinAndSelect("aasDescriptor.roles", "role")
      .getMany();

    //we need only the ids from the AAS IIdentifier
    var aasIds = aasDescriptorEntities.map(identification => identification.id);
    console.log("AASDescriptorIds for the given roles " + JSON.stringify(aasIds));

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


      console.log("Descriptors loaded  " + JSON.stringify(aasDescriptorEntities))

      // Find the AASDescriptors for the given roles

      //get the IRole Array for returning, contruct from the RoleEntity
      let rolesArr: IRole[] = resultSemanticProtocol.roles.map((roleEntity) => {

        return {

          name: roleEntity.name,
          aasDescriptorIds: aasDescriptorEntities
        } as IRole
      });
      let protocolIdentifier = new Identifier(resultSemanticProtocol.id, resultSemanticProtocol.idType as TIdType);
      console.log("Roles  " + JSON.stringify(rolesArr))

      var response = new SemanticProtocolResponse(protocolIdentifier, rolesArr);

      return response;

    } catch (error) {
      console.log("Error caught " + error)
      throw error;

    }

  }
  async listAll(): Promise<Array<IEndpoint>> {

    return []
  }
}

export { Registry };
