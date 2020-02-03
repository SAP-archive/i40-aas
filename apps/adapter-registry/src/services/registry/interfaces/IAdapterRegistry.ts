import { IStorageAdapter } from './IRegistryResultSet';
import { ICreateAdapter, ICreateSubmodelEntry } from './IAPIRequests';
import { IIdentifier } from 'i40-aas-objects';

interface IAdapterRegistry {
  createAdapter(req: ICreateAdapter): Promise<IStorageAdapter>;
  updateAdapter(req: ICreateAdapter): Promise<IStorageAdapter>;
  deleteAdapterByAdapterID(aasId: IIdentifier): Promise<void>;
  getAdapterBySubmodelId(submodelId: string): Promise<IStorageAdapter>;
  getAdapterBySubmodelSemanticId(submodelId: string): Promise<IStorageAdapter>;
  release(): void;
  clearAll(): Promise<void>;
  //regsiter a new submodel that can be handled from an adapter
  createSubmodel(req: ICreateSubmodelEntry): void;
  }

export { IAdapterRegistry };
