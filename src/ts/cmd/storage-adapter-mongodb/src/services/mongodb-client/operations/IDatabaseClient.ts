import { WriteOpResult } from 'mongodb';
import { ISubmodelRecord } from '../model/ISubmodelRecord';

interface IDatabaseClient {
  connect: () => void;
  update(
    key: any,
    fieldsToUpdate: any,
    newVersion: boolean
  ): Promise<WriteOpResult>;
  getOneByKey(filter: any): Promise<ISubmodelRecord | null>;
  getAll(): Promise<ISubmodelRecord[]>;
  deleteOne(filter: any): void;
  disconnect: () => void;
}

export { IDatabaseClient };
