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
  protocol: Protocols;
  protocolVersion?: string;
}

class Endpoint implements IEndpoint {
  public url: string;
  public protocol: Protocols;
  public protocolVersion?: string;
  constructor(url: string, protocol: Protocols, protocolVersion?: string) {
    this.url = url;
    this.protocol = protocol;
    this.protocolVersion = protocolVersion;
  }
}

enum Protocols {
  https = 'https',
  http = 'http',
  ws = 'ws',
  wss = 'wss'
}

/*
var x = {
  aasId: { id: '', idType: '' },
  endpoints: [{ url: '', protocol: "https", protocolVersion: '1.1' }],
  assetId: { id: '', idType: '' }
}; */
export { RegistryResultSet, Endpoint, Protocols, IEndpoint, IRegistryResultSet };
