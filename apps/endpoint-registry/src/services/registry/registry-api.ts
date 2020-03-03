import { RegistryFactory } from './daos/postgress/RegistryFactory';
import { IIdentifier } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
import {
  RegistryResultSet,
  IRegistryResultSet
} from './daos/interfaces/IRegistryResultSet';
import { iRegistry } from './daos/interfaces/IRegistry';
import {
  IRegisterAas,
  ICreateRole,
  ICreateSemanticProtocol,
  IAssignRoles,
  ICreateAsset
} from './daos/interfaces/IApiRequests';
import { TIdType } from 'i40-aas-objects/dist/src/types/IdTypeEnum';

async function readRecordByIdentifier(
  identifier: IIdentifier
): Promise<Array<RegistryResultSet>> {
  var registryDao: iRegistry = await RegistryFactory.getRegistryNew();
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
async function deleteRecordByIdentifier(
  identifier: IIdentifier
): Promise<number> {
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    if (!identifier.id) {
      throw new RegistryError('Missing parameter id', 422);
    }
    var result = await registryDao.deleteAasByAasId(identifier);
    console.log('Deleted rows: ' + result);
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}

async function readRecordBySemanticProtocolAndRole(
  sProtocol: string,
  role: string
): Promise<any> {
  console.log(sProtocol);
  console.log(role);
  var registryDao: iRegistry = await RegistryFactory.getRegistryNew();
  try {
    var result = await registryDao.readEndpointBySemanticProtocolAndRole(
      sProtocol,
      role
    );
    console.log(JSON.stringify(result, null, 3));
    return result;
  } catch (e) {
    throw e;
  } finally {
    registryDao.release();
  }
}

async function register(req: IRegisterAas) {
  var registryDao: iRegistry = await RegistryFactory.getRegistryNew();
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

async function createAsset(req: ICreateAsset) {
  var registryDao: iRegistry = await RegistryFactory.getRegistry();
  try {
    var result = await registryDao.createAsset(req);
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

async function getEndpointsByReceiverId(
  receiverId: string,
  receiverIdType: TIdType
): Promise<Array<IRegistryResultSet>> {
  return readRecordByIdentifier({
    id: receiverId,
    idType: receiverIdType
  });
}

//TODO: why is this extra level of indirection needed?
//getEndpointsByReceiverRolejust forwards the call
async function getEndpointsByReceiverRole(
  receiverRole: string,
  semanticProtocol: string
): Promise<Array<IRegistryResultSet>> {
  if (!semanticProtocol) {
    throw new RegistryError('Missing parameter semanticProtocol', 422);
  }
  return readRecordBySemanticProtocolAndRole(semanticProtocol, receiverRole);
}

async function getAllEndpointsList(): Promise<Array<IRegistryResultSet>> {
  var registryDao: iRegistry = await RegistryFactory.getRegistryNew();
  try {
    var result = await registryDao.listAllEndpoints();
    console.log(result);
    return result;
  } catch (e) {
    console.log(e);
    throw e;
  } finally {
    registryDao.release();
  }
}

export {
  readRecordByIdentifier,
  deleteRecordByIdentifier,
  assignRolesToAAS,
  getAllEndpointsList,
  createSemanticProtocol,
  register,
  readRecordBySemanticProtocolAndRole,
  getEndpointsByReceiverRole,
  getEndpointsByReceiverId,
  createRole,
  createAsset
};
