import { RegistryFactory } from './daos/postgres/RegistryFactory';
import { iRegistry } from './daos/interfaces/IRegistry';
import { DeleteResult } from 'typeorm';
import { IAASDescriptor } from './daos/interfaces/IAASDescriptor';
import { IEndpoint } from './daos/interfaces/IEndpoint';
import { ISemanticProtocol } from './daos/interfaces/ISemanticProtocol';
import { IIdentifier } from 'i40-aas-objects';
const logger = require('aas-logger/lib/log');

class RegistryApi {
  async deleteAASIdFromRole(semanticProtocolId: string, roleName: string, aasId: string) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    var result = await registryDao.deleteAASIdFromRole(semanticProtocolId, roleName, aasId);
    logger.debug(result);
    return result;  }


  async updatedAASIDsToRole(semanticProtocolId: string, roleName: string, aasIdsArray: Array<IIdentifier>) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    var result = await registryDao.updateAASDescriptorsToRole(semanticProtocolId, roleName, aasIdsArray);
    logger.debug(result);
    return result;
  }

  async readAASDescriptorByAASId(
    aasId: string
  ): Promise<IAASDescriptor> {
    //TODO: dependency injection is better
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.readAASDescriptorByAasId(aasId);
      logger.debug(result);
      return result;
  }
  async updateAASDescriptorByAASId(
    req: IAASDescriptor
  ): Promise<IAASDescriptor> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.updateAasDescriptorByAasId(req);
      logger.debug(result);
      return result;
  }
  async updateSemanticProtocolById(
    req: ISemanticProtocol
  ): Promise<ISemanticProtocol> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.updateSemanticProtocolById(req);
      logger.debug(result);
      return result;
  }
  async deleteAASDescriptorByAASId(
    aasId: string
  ): Promise<DeleteResult> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.deleteAasDescriptorByAasId(aasId);
      logger.debug(result);
      return result;
  }


  async readAASBySemanticProtocolAndRole(
    sProtocol: string,
    role: string
  ): Promise<any> {

    var registryDao: iRegistry = await RegistryFactory.getRegistry();

    var result = await registryDao.readAASDescriptorsBySemanticProtocolAndRole(
        sProtocol,
        role
      );
      logger.debug(JSON.stringify(result, null, 3));
      return result;

  }
  async readSemanticProtocolBySemanticProtocolId(
    sProtocol: string,
  ): Promise<ISemanticProtocol> {

    var registryDao: iRegistry = await RegistryFactory.getRegistry();

    var result = await registryDao.readSemanticProtocolById(
        sProtocol
      );
      logger.debug(JSON.stringify(result, null, 3));
      return result;

  }
  async readAllSemanticProtocols(
  ): Promise<Array<ISemanticProtocol>> {

    var registryDao: iRegistry = await RegistryFactory.getRegistry();

    var result = await registryDao.listAllSemanticProtocols(
      );
   //   logger.debug(JSON.stringify(result, null, 3));
      return result;

  }

  async registerOrReplaceAASDescriptor(req: IAASDescriptor) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.upsertAASDescriptor(req);
      logger.debug(result);
      return result;
    } catch (e) {
      throw e;
    }
  }
  async register(req: IAASDescriptor) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.createAASDescriptor(req);
      logger.debug(result);
      return result;
    } catch (e) {
      throw e;
    }
  }


  async createSemanticProtocol(req: ISemanticProtocol) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.createSemanticProtocol(req);
      logger.debug(result);
      return result;
    } catch (e) {
      throw e;
    }
  }
  async createOrUpdateSemanticProtocol(req: ISemanticProtocol) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.upsertSemanticProtocol(req);
      logger.debug(result);
      return result;
    } catch (e) {
      throw e;
    }
  }
  async deleteSemanticProtocol(req: string) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.deleteSemanticProtocolById(req);
      logger.debug(result);
      return result;
    } catch (e) {
      throw e;
    }
  }


  async getAllEndpointsList(): Promise<Array<IEndpoint>> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.listAllEndpoints();
      logger.debug(result);
      return result;
    } catch (e) {
      logger.error(e);
            throw e;
    }
  }
}

export { RegistryApi };
