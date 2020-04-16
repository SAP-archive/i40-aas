import { iRegistry } from '../interfaces/IRegistry';
import { AssetEntity } from '../entities/AssetEntity';
import { Connection, createConnection, UpdateResult, DeleteResult } from 'typeorm';
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
import { RegistryError } from '../../../../utils/RegistryError';
import { IEndpoint } from '../interfaces/IEndpoint';
import { SemanticProtocolResponse } from '../responses/SemanticProtocolResponse';
import { IRole } from '../interfaces/IRole';

class Registry implements iRegistry {




  updateSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol> {
    throw new Error("Method not implemented.");
  }


  listAllEndpoints(): Promise<IEndpoint[]> {
    throw new Error("Method not implemented.");
  }
  constructor(private readonly client: Connection) {
  }

  async registerAas(record: IAASDescriptor): Promise<IAASDescriptor | undefined> {
    //TODO: remove cast once migration complete

    try {
      //create Asset associated with this AAS
      // have seperate handlers for each entity and report errors e.g. when assetid present
      let asset = new AssetEntity();
      asset.id = record.asset.id;
      asset.idType = record.asset.idType;

      let savedAsset = await this.client.manager.save(asset);
      console.log("Asset Saved in Db ", asset);

      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let endpointsRepository = this.client.getRepository(EndpointEntity);

      //finally create the AASDescriptor in DB
      let aasDescriptor = new AASDescriptorEntity();
      aasDescriptor.id = record.identification.id;
      aasDescriptor.idType = record.identification.idType;
      aasDescriptor.asset = record.asset;
      aasDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40;
      aasDescriptor.signature = record.descriptor.signature;
      //await this.client.manager.save(aasDescriptor);
      //Create if not exists, update if it does
      let savedAASDescriptor = await aasDescriptorRepository.save(aasDescriptor);

      console.log("AASDescriptor Saved in Db ", aasDescriptor);


      await Promise.all(
        record.descriptor.endpoints.map(async endpoint => {
          let ep = new EndpointEntity();
          ep.aasdescriptor = aasDescriptor; //one to many relation
          ep.address = endpoint.address;
          ep.type = endpoint.type;
          ep.target = endpoint.target;
          await endpointsRepository.save(ep);
          console.log("Endpoint Saved in Db ", ep);

        })
      );
      return record;
    } catch (error) {
      console.log(error)
      return undefined
    }

  }

  async updateAasDescriptorByAasId(record: IAASDescriptor): Promise<IAASDescriptor | undefined> {

    try {
      //This is the most efficient way in terms of performance to update entities in your database (see https://typeorm.io/#/update-query-builder )
      console.debug("cert " + record.descriptor.certificate_x509_i40);

      let aasDescriptor = await this.client
        .createQueryBuilder()
        .update(AASDescriptorEntity)
        .set({
          asset: record.asset,
          certificate_x509_i40: record.descriptor.certificate_x509_i40,
          signature: record.descriptor.signature
        })
        .where("id = :id", { id: record.identification.id })
        .execute();

      console.log("AASDescriptor updated in Db " + JSON.stringify(aasDescriptor));

      //updated each Endpoint refering to this AAS
      await Promise.all(
        record.descriptor.endpoints.map(async endpoint => {

          let updateResult = await this.client
            .createQueryBuilder()
            .update(EndpointEntity)
            .set({
              address: endpoint.address,
              type: endpoint.type
            })
            .where("aasdescriptor = :aasdescriptor", { aasdescriptor: record.identification.id })
            .andWhere("address = :address", { address: endpoint.address })
            .execute();

          console.log("Endpoint Upated in Db ", updateResult);

        })
      );
      return record

    } catch (error) {
      console.log("Error caught " + error)
      return undefined
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
      return undefined
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
      return record
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


      console.debug("asset id " + JSON.stringify(resultAasDescriptor));
      let resultAsset = await aasAssetRepository.findOne({ id: resultAasDescriptor.asset.id }) as AssetEntity
      let aasDescrIdentifier = new Identifier(resultAasDescriptor.id, resultAasDescriptor.idType as TIdType);
      let descr = new GenericDescriptor(resultAasDescriptor.endpoints, resultAasDescriptor.certificate_x509_i40, resultAasDescriptor.signature);

      let assetIdentifier = new Identifier(resultAsset.id, resultAsset.idType as TIdType);

      let response = new AASDescriptorResponse(aasDescrIdentifier, assetIdentifier, descr);
      return response;



    } catch (err) {
      throw new RegistryError(err, 500);
    }

    //if not found return undefined


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

    console.log("AASDescriptorResponses for the given roles " + JSON.stringify(AASDescriptors));

    return AASDescriptors;
  }



  async readSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol> {


    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let semProtocolRepository = this.client.getRepository(SemanticProtocolEntity);
    //  let rolesRepository = this.client.getRepository(RoleEntity);

      //Load the AASDescriptor object from the DB as well as the related Objects (Endpoints, Asset)
      let resultSemanticProtocol = await semProtocolRepository.findOne({
        where: [
          { id: semanticProtocolId },],
        relations: ["roles"]
      }) as SemanticProtocolEntity;

      console.log("Semanticprotocol loaded  " + JSON.stringify(resultSemanticProtocol))

      //get the IRole Array for returning, contruct from the RoleEntity
      let rolesArr:IRole[] = resultSemanticProtocol.roles.map(function (roleEntity) {
        return {
         name:  roleEntity.name,
         aasDescriptorIds: roleEntity.aasDescriptors
        } as IRole
      });
      let protocolIdentifier = new Identifier(resultSemanticProtocol.id, resultSemanticProtocol.idType as TIdType);
      console.log("Roles  " + JSON.stringify(rolesArr))

      var response = new SemanticProtocolResponse(protocolIdentifier, rolesArr);

      return response;

    } catch (error) {
      console.log("Error caught " + error)
      throw new RegistryError(error, 500);

    }

  }




  async listAll(): Promise<Array<IEndpoint>> {

    return []
  }
}

export { Registry };
