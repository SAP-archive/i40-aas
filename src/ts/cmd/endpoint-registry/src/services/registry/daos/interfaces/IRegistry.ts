import { IIdentifier } from 'i40-aas-objects';
import { RegistryResultSet, IRegistryResultSet } from './IRegistryResultSet';
import {
  ISemanticProtocol,
} from './ISemanticProtocol';
import { DeleteResult } from 'typeorm';
import { IAASDescriptor } from './IAASDescriptor';

interface iRegistry {
  readAASDescriptorByAasId(aasId: string): Promise<IAASDescriptor|undefined>;
  registerAas(req: IAASDescriptor): Promise<IAASDescriptor | undefined>;
  updateAasDescriptorByAasId(req: IAASDescriptor): Promise<IAASDescriptor | undefined>;
  deleteAasDescriptorByAasId(aasId: string): Promise<DeleteResult|undefined>;
  listAllEndpoints(): Promise<Array<RegistryResultSet>>;
  createSemanticProtocol(req: ISemanticProtocol): void;
  readAASDescriptorsBySemanticProtocolAndRole(
    sProtocol: string,
    role: string
  ): Promise<Array<IAASDescriptor>| undefined>;
}

export { iRegistry };
