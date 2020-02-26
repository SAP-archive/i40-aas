import { IIdentifier } from 'i40-aas-objects';
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

interface IEndpoint {
  url: string;
  protocol: string;
  target: TTarget;
  protocolVersion?: string;
}

class Endpoint implements IEndpoint {
  public url: string;
  public protocol: string;
  public protocolVersion?: string;

  constructor(
    url: string,
    public target: TTarget,
    protocol: string,
    protocolVersion?: string
  ) {
    this.url = url;

    protocol
      ? (this.protocol = protocol.toLowerCase())
      : (this.protocol = protocol);

    this.protocolVersion = protocolVersion;
  }
}

/*
var x = {
  aasId: { id: '', idType: '' },
  endpoints: [{ url: '', protocol: "https", protocolVersion: '1.1' }],
  assetId: { id: '', idType: '' }
}; */
export { RegistryResultSet, Endpoint, IEndpoint, IRegistryResultSet, TTarget };
