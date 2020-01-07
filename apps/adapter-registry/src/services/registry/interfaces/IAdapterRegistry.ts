import { IAdapterAssignmentResultSet, IStorageAdapter } from './IRegistryResultSet';
import { IRegisterAdapterAssignment, ICreateAdapter, ICreateSubmodelEntry } from './IAPIRequests';
import { Identifier } from 'i40-aas-objects';

interface IAdapterRegistry {
  readAdapterRecordByID(adapterId: Identifier): Promise<Array<IAdapterAssignmentResultSet>>;
  registerAdapter(req: ICreateAdapter): Promise<IAdapterAssignmentResultSet>;
  updateAdapter(req: ICreateAdapter): Promise<IAdapterAssignmentResultSet>;
  deleteAdapterByAdapterID(aasId: Identifier): Promise<void>;
  getAdapterBySubmodelId(submodelId: string): Promise<IStorageAdapter>;
  listAllSubmodels(): Promise<Array<IAdapterAssignmentResultSet>>;
  release(): void;
  clearAll(): Promise<void>;
  //regsiter a new submodel that can be handled from an adapter
  createSubmodel(req: ICreateSubmodelEntry): void;
  //assign an Adapter to handle a Submodels type
  registerAdapterAssignment(req: IRegisterAdapterAssignment): void;
}

export { IAdapterRegistry };
