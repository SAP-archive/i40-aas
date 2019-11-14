import { Submodel } from "i40-aas-objects";
import * as logger from "winston";
import { WebClient } from "./WebClient/WebClient";
import { IStorageAdapter } from "./interfaces/IStorageAdapter";



class AdapterConnector{
private webClient = new WebClient();


constructor(wC:WebClient){
this.webClient = wC;

}


/**
 * Make a post request to the storage adapter responsible for handling the Submodel type
 * @param sm The submodel element
 * @param adapter The storage adapter object
 */
async postSubmoduleToAdapter(
  sm: Submodel,
  adapter: IStorageAdapter
) {
  //get the url of the storage adapter from the object
  let adapter_url: string = adapter.url;

  return await this.webClient.postRequest(adapter_url, sm);
}

}

export {AdapterConnector}
