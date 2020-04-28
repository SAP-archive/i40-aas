import { Submodel } from 'i40-aas-objects';
import { WebClient } from './WebClient/WebClient';
import { IStorageAdapter } from './interfaces/IStorageAdapter';

const logger = require('aas-logger/lib/log');

class AdapterConnector {
  private webClient = new WebClient();

  constructor(wC: WebClient) {
    this.webClient = wC;
  }

  /**
   * Make a post request to the storage adapter responsible for handling the Submodel type
   * @param sm The submodel element
   * @param adapter The storage adapter object
   */
  async postSubmoduleToAdapter(sm: Submodel, adapter: IStorageAdapter) {
    //get the url of the storage adapter from the object
    let adapter_url: string = adapter.url;

    return await this.webClient.postSubmodelToAdapterRequest(adapter_url, sm);
  }
  async getSubmoduleFromAdapter(adapter: IStorageAdapter) {
    //get the url of the storage adapter from the object
    let adapter_url: string = adapter.url;

    return await this.webClient.getSubmodelFromAdapterRequest(adapter_url);
  }
}

export { AdapterConnector };
