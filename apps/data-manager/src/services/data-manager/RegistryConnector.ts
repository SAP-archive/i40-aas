import * as logger from "winston";
import { Submodel } from "i40-aas-objects";
import { IStorageAdapter } from "./interfaces/IStorageAdapter";
import { WebClient } from "./WebClient/WebClient";

const dotenv = require("dotenv");
dotenv.config();

class AdapterRegistryConnector {
  private webClient: WebClient;
  private registryGETAdaptersURL:URL;
  private adapter_reg_user: string;
  private adapter_reg_pass: string;

  constructor(
    wC: WebClient,
    registryGETAdaptersURL:URL,
    adapter_reg_user: string,
    adapter_reg_pass: string
  ) {
    this.webClient = wC;
    this.registryGETAdaptersURL = registryGETAdaptersURL;
    this.adapter_reg_user = adapter_reg_user;
    this.adapter_reg_pass = adapter_reg_pass;
  }

  //get the URL of the adapter from the Adapter registry
  async getAdapterFromRegistry(
    submodelIdShort: string
  ): Promise<IStorageAdapter> {
    var regResponse = await this.webClient.getRequest(
      this.registryGETAdaptersURL.href,
      submodelIdShort,
      this.adapter_reg_user,
      this.adapter_reg_pass
    );

    let adapter = regResponse.data as IStorageAdapter;

    if(adapter.url){
          logger.debug(
      `The submodel with id ${submodelIdShort}, will be routed to ${adapter.url}`
    );
    }
    //TODO: Validation required


    return adapter;
  }
}

export {AdapterRegistryConnector}
