import { Identifier } from 'i40-aas-objects';
interface IRegistryResultSet {
  aasId: Identifier;
  endpoints: Array<Endpoint>;
  assetId: Identifier;
}
class RegistryResultSet implements IRegistryResultSet {
  public aasId: Identifier;
  public endpoints: Array<Endpoint>;
  public assetId: Identifier;
  constructor(aasId: Identifier, endpoints: Array<Endpoint>, assetId: Identifier) {
    this.aasId = aasId;
    this.endpoints = endpoints;
    this.assetId = assetId;
  }
}

interface IEndpoint {
  url: string;
  protocol: string;
  protocolVersion?: string;
}

class Endpoint implements IEndpoint {
  public url: string;
  public protocol: string;
  public protocolVersion?: string;
  constructor(url: string, protocol: string, protocolVersion?: string) {

    this.url = url;

  (protocol )? this.protocol = protocol.toLowerCase(): this.protocol = protocol;

    this.protocolVersion = protocolVersion;
  }
}

/*
var x = {
  aasId: { id: '', idType: '' },
  endpoints: [{ url: '', protocol: "https", protocolVersion: '1.1' }],
  assetId: { id: '', idType: '' }
}; */
export { RegistryResultSet, Endpoint, IEndpoint, IRegistryResultSet };
