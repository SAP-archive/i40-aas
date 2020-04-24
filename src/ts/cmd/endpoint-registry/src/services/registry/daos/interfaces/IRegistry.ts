import {
  ISemanticProtocol,
} from './ISemanticProtocol';
import { DeleteResult } from 'typeorm';
import { IAASDescriptor } from './IAASDescriptor';
import { IEndpoint } from './IEndpoint';

interface iRegistry {
  readAASDescriptorByAasId(aasId: string): Promise<IAASDescriptor>;
  createAASDescriptor(req: IAASDescriptor): Promise<IAASDescriptor | undefined>;
  upsertAASDescriptor(req: IAASDescriptor): Promise<IAASDescriptor | undefined>;
  updateAasDescriptorByAasId(req: IAASDescriptor): Promise<IAASDescriptor | undefined>;
  deleteAasDescriptorByAasId(aasId: string): Promise<DeleteResult|undefined>;
  deleteSemanticProtocolById(semanticProtocolId: string): Promise<DeleteResult|undefined>;
  readSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol>;
  updateSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol>;
  listAllEndpoints(): Promise<Array<IEndpoint>>;
  listAllSemanticProtocols(): Promise<Array<ISemanticProtocol>>;
  createSemanticProtocol(req: ISemanticProtocol): void;
  readAASDescriptorsBySemanticProtocolAndRole(
    sProtocol: string,
    role: string
  ): Promise<Array<IAASDescriptor>| undefined>;
}

export { iRegistry };
