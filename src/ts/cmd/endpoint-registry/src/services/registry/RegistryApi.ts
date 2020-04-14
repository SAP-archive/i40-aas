import { RegistryFactory } from './daos/postgres/RegistryFactory';
import { IIdentifier } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
import {
  RegistryResultSet,
  IRegistryResultSet
} from './daos/interfaces/IRegistryResultSet';
import { iRegistry } from './daos/interfaces/IRegistry';
import {  ISemanticProtocol} from './daos/interfaces/ISemanticProtocol';
import { TIdType } from 'i40-aas-objects/dist/src/types/IdTypeEnum';
import { DeleteResult } from 'typeorm';
import { IAASDescriptor } from './daos/interfaces/IAASDescriptor';

class RegistryApi {

  async readAASDescriptorByAASId(
    aasId: string
  ): Promise<IAASDescriptor | undefined> {
    //TODO: dependency injection is better
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.readAASDescriptorByAasId(aasId);
      console.log(result);
      return result;
  }
  async updateAASDescriptorByAASId(
    req: IAASDescriptor
  ): Promise<IAASDescriptor | undefined> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.updateAasDescriptorByAasId(req);
      console.log(result);
      return result;
  }
  async deleteAASDescriptorByAASId(
    aasId: string
  ): Promise<DeleteResult|undefined> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
      var result = await registryDao.deleteAasDescriptorByAasId(aasId);
      console.log(result);
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
      console.log(JSON.stringify(result, null, 3));
      return result;

  }

  async register(req: IAASDescriptor) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.registerAas(req);
      console.log(result);
      return result;
    } catch (e) {
      throw e;
    }
  }


  async createSemanticProtocol(req: ISemanticProtocol) {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.createSemanticProtocol(req);
      console.log(result);
      return result;
    } catch (e) {
      throw e;
    }
  }


  async getAllEndpointsList(): Promise<Array<IRegistryResultSet>> {
    var registryDao: iRegistry = await RegistryFactory.getRegistry();
    try {
      var result = await registryDao.listAllEndpoints();
      console.log(result);
      return result;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

export { RegistryApi };
