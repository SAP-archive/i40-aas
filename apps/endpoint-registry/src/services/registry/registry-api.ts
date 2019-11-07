import { RegistryFactory } from './daos/postgress/RegistryFactory';
import { Identifier, Frame, IdTypeEnum } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
import { RegistryResultSet, IRegistryResultSet } from './daos/interfaces/IRegistryResultSet';
import { iRegistry } from './daos/interfaces/IRegistry';
import { IRegisterAas, ICreateRole, ICreateSemanticProtocol, IAssignRoles } from './daos/interfaces/IApiRequests';

async function readRecordByIdentifier(identifier: Identifier): Promise<Array<RegistryResultSet>> {
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    if (!identifier.id) {
      throw new RegistryError('Missing parameter id', 422);
    }
    var result = await registryDao.readRecordByAasId(identifier);
    console.log(result);
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}

async function readRecordBySemanticProtocolAndRole(sProtocol: string, role: string): Promise<any> {
  console.log(sProtocol);
  console.log(role);
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    var result = await registryDao.readEndpointBySemanticProtocolAndRole(sProtocol, role);
    console.log(JSON.stringify(result, null, 3));
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}

async function register(req: IRegisterAas) {
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    var result = await registryDao.registerAas(req);
    console.log(result);
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}
async function createRole(req: ICreateRole) {
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    var result = await registryDao.createRole(req);
    console.log(result);
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}
async function assignRolesToAAS(req: IAssignRoles) {
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    var result = await registryDao.assignRoles(req);
    console.log(result);
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}
async function createSemanticProtocol(req: ICreateSemanticProtocol) {
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    var result = await registryDao.createSemanticProtocol(req);
    console.log(result);
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}

async function getEndpointsByFrame(frame: Frame): Promise<Array<IRegistryResultSet>> {
  if (!frame) {
    throw new RegistryError('Missing parameter frame', 422);
  }
  if (frame.receiver.identification) {
    return readRecordByIdentifier({ id: frame.receiver.identification.id, idType: (<any>IdTypeEnum)[frame.receiver.identification.idType] });
  } else {
    return readRecordBySemanticProtocolAndRole(frame.semanticProtocol, frame.receiver.role.name);
  }
}
export { readRecordByIdentifier,assignRolesToAAS, createSemanticProtocol, register, readRecordBySemanticProtocolAndRole, getEndpointsByFrame, createRole };
