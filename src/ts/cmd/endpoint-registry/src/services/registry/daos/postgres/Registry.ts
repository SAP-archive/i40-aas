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
import { ISemanticProtocol } from '../interfaces/ISemanticProtocol';
import { SemanticProtocolEntity } from '../entities/SemanticProtocolEntity';
import { RoleEntity } from '../entities/RoleEntity';
import { RegistryError } from '../../../../utils/RegistryError';
import { IEndpoint } from '../interfaces/IEndpoint';

class Registry implements iRegistry {


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


      //finally create the AASDescriptor in DB
      let aasDescriptor = new AASDescriptorEntity();
      aasDescriptor.id = record.identification.id;
      aasDescriptor.idType = record.identification.idType;
      aasDescriptor.asset = record.asset;
      aasDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40;
      aasDescriptor.signature = record.descriptor.signature;
      await this.client.manager.save(aasDescriptor);
      console.log("AASDescriptor Saved in Db ", aasDescriptor);


      await Promise.all(
        record.descriptor.endpoints.map(async endpoint => {
          let ep = new EndpointEntity();
          ep.aasdescriptor = aasDescriptor; //one to many relation
          ep.address = endpoint.address;
          ep.type = endpoint.type;
          await this.client.manager.save(ep);
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

      //updated each Endpoint refering to this AAS
      /*
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
              .andWhere("address = :address", { address: endpoint.address})
              .execute();

            console.log("Endpoint Upated in Db ", updateResult);

          })
        );
        */
      return aasDescriptor;

    } catch (error) {
      console.log("Error caught " + error)
      return undefined
    }

  }

  async createSemanticProtocol(
    record: import('../interfaces/ISemanticProtocol').ISemanticProtocol
  ): Promise<ISemanticProtocol | undefined> {
    try {
      //get an Entityrepository for the AASDescriptor and the Asset
      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);

      //1. create a semantic protocol and save it to the DB
      let semProtocol = new SemanticProtocolEntity();
      semProtocol.id = record.identification.id;
      semProtocol.idType = record.identification.idType;

      let savedProtocol = await this.client.manager.save(semProtocol);
      console.log("Asset Saved in Db ", savedProtocol);

      //2. create Roles associated with this semanticProtocol
      // have seperate handlers for each entity and report errors e.g. when assetid present

      await Promise.all(
        record.roles.map(async role => {
          let rE = new RoleEntity();
          rE.semProtocol = semProtocol; //many to one relation
          rE.name = role.name;

          await this.client.manager.save(rE);
          console.log("Endpoint Saved in Db ", rE);


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
      console.log("Error while creating the relations " + error)
      return undefined
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
        relations: ["endpoints", "asset"]
      });

      if (resultAasDescriptor) {
        console.debug("asset id " + JSON.stringify(resultAasDescriptor));
        let resultAsset = await aasAssetRepository.findOne({ id: resultAasDescriptor.asset.id })
        let aasDescrIdentifier = new Identifier(resultAasDescriptor.id, resultAasDescriptor.idType as TIdType);
        let descr = new GenericDescriptor(resultAasDescriptor.endpoints, resultAasDescriptor.certificate_x509_i40, resultAasDescriptor.signature);
        if (resultAsset) {
          let assetIdentifier = new Identifier(resultAsset.id, resultAsset.idType as TIdType);

          let response = new AASDescriptorResponse(aasDescrIdentifier, assetIdentifier, descr);
          return response;
        }
      }
      return {} as AASDescriptorResponse;
    } catch (err) {
      throw new RegistryError(err, 500);
    }
    //if not found return undefined


  }


  async readAASDescriptorsBySemanticProtocolAndRole(
    sProtocol: string,
    roleName: string
  ): Promise<Array<IAASDescriptor> | undefined> {

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

  async listAll(): Promise<Array<IEndpoint>> {

    return []
  }
}

export { Registry };
