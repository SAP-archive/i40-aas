import { WriteOpResult } from "mongodb";
import { IStateRecord } from "./IStateRecord";

interface IDatabaseClient {
  connect: () => void;
  update(
    key: any,
    fieldsToUpdate: any,
    newVersion: boolean
  ): Promise<WriteOpResult>;
  getOneByKey(filter: any): Promise<IStateRecord | null>;
  disconnect: () => void;
}

export { IDatabaseClient };
