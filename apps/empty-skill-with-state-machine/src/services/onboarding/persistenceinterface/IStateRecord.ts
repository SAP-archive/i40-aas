interface IStateRecord {
  _id: string;
  version: number;
  serializedState: string;
}

export { IStateRecord };
