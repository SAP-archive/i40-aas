import {
  ISemanticProtocol,
} from './ISemanticProtocol';
import { DeleteResult } from 'typeorm';
import { IAASDescriptor } from './IAASDescriptor';
import { IEndpoint } from './IEndpoint';
import { IIdentifier } from 'i40-aas-objects';
import { IRole } from './IRole';

interface iRegistry {
  readAASDescriptorByAasId(aasId: string): Promise<IAASDescriptor>;
  createAASDescriptor(req: IAASDescriptor): Promise<IAASDescriptor>;
  upsertAASDescriptor(req: IAASDescriptor): Promise<IAASDescriptor>;
  updateAasDescriptorByAasId(req: IAASDescriptor): Promise<IAASDescriptor>;
  deleteAasDescriptorByAasId(aasId: string): Promise<DeleteResult>;
  deleteSemanticProtocolById(semanticProtocolId: string): Promise<DeleteResult>;
  readSemanticProtocolById(semanticProtocolId: string): Promise<ISemanticProtocol>;
  updateSemanticProtocolById(semanticProtocol: ISemanticProtocol): Promise<ISemanticProtocol>;
  listAllAASDescriptors(): Promise<Array<IAASDescriptor>>;
  listAllSemanticProtocols(): Promise<Array<ISemanticProtocol>>;
  createSemanticProtocol(req: ISemanticProtocol): Promise<ISemanticProtocol>;
  upsertSemanticProtocol(req: ISemanticProtocol): Promise<ISemanticProtocol>;
  readAASDescriptorsBySemanticProtocolAndRole(
    sProtocol: string,
    role: string
  ): Promise<Array<IAASDescriptor>>;
  updateAASDescriptorsToRole(
    sProtocol: string,
    role: string,
    aasIds: IIdentifier[]
  ): Promise<IRole>;
  deleteAASIdFromRole(
    sProtocol: string,
    role: string,
    aasId: string): Promise<IRole>;
}

export { iRegistry };
