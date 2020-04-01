import { IIdentifier } from 'i40-aas-objects';
import { IEndpoint } from './IEndpoint';
interface IRegistryResultSet {
  aasId: IIdentifier;
  endpoints: Array<Endpoint>;
  assetId: IIdentifier;
}
class RegistryResultSet implements IRegistryResultSet {
  public aasId: IIdentifier;
  public endpoints: Array<Endpoint>;
  public assetId: IIdentifier;
  constructor(
    aasId: IIdentifier,
    endpoints: Array<Endpoint>,
    assetId: IIdentifier
  ) {
    this.aasId = aasId;
    this.endpoints = endpoints;
    this.assetId = assetId;
  }
}

enum TTarget {
  cloud,
  edge
}


class Endpoint implements IEndpoint {
  public address: string;
  public type: string;

  constructor(
    address: string,
    type: string,

  ) {
    this.address = address;
    this.type = type;

  }
}

/*
var x = {
  aasId: { id: '', idType: '' },
  endpoints: [{ url: '', protocol: "https", protocolVersion: '1.1' }],
  assetId: { id: '', idType: '' }
}; */
export { RegistryResultSet, Endpoint, IRegistryResultSet, TTarget };
