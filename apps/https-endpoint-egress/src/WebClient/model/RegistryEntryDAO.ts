
interface IRegistryEntry {
    aasId: IaasID;
    endpoints: Array<IEndpoint>;
    assetId: IassetId;
}

interface IaasID {
    id: string;
    idType: string;
}
interface IassetId {
    id: string;
    idType: string;
}
interface IEndpoint {
    url: string;
    protocolVersion: string;
    protocol: string;
}

class RegistryEntry implements IRegistryEntry{
    aasId: IaasID;
    endpoints: Array<IEndpoint>;
    assetId: IassetId;

    constructor(obj: IRegistryEntry){
        this.aasId = obj.aasId;
        this.endpoints = obj.endpoints;
        this.assetId = obj.assetId;
    }


}
export {RegistryEntry, IRegistryEntry, IEndpoint};