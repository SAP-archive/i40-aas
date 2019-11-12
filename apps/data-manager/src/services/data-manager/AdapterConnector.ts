import { Submodel } from "i40-aas-objects";
import * as logger from "winston";
import { WebClient } from "./WebClient/WebClient";
import { IStorageAdapter } from "./interfaces/IStorageAdapter";

var webClient = new WebClient();
/**
 * Make a post request to the storage adapter responsible for handling the Submodel type
 * @param sm The submodel element
 * @param adapter The storage adapter object
 */
export async function postSubmoduleToAdapter(
  sm: Submodel,
  adapter: IStorageAdapter
) {
  //find which adapter is responsible for handling the submodel

  //get the url of the storage adapter from the object
  let adapter_url: string = adapter.url;

  return await webClient.postRequest(adapter_url, sm);
}
