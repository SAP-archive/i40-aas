import { RegistryFactory } from './daos/postgres/RegistryFactory';
import { iRegistry } from './daos/interfaces/IRegistry';
import { DeleteResult } from 'typeorm';
import { IAASDescriptor } from './daos/interfaces/IAASDescriptor';
import { IEndpoint } from './daos/interfaces/IEndpoint';
import { ISemanticProtocol } from './daos/interfaces/ISemanticProtocol';
const logger = require('aas-logger/lib/log');

class RegistryApi {

  async readAASDescriptorByAASId(
    aasId: string
  ): Promise<IAASDescriptor | undefined> {
    //TODO: dependency injection is better
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.readAASDescriptorByAasId(aasId);
      logger.info(result);
      return result;
  }
  async updateAASDescriptorByAASId(
    req: IAASDescriptor
  ): Promise<IAASDescriptor | undefined> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.updateAasDescriptorByAasId(req);
      logger.info(result);
      return result;
  }
  async deleteAASDescriptorByAASId(
    aasId: string
  ): Promise<DeleteResult|undefined> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.deleteAasDescriptorByAasId(aasId);
      logger.info(result);
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
  ): Promise<any> {

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
