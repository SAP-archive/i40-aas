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


  /**
  * get the URL of the adapter from the Adapter registry. There are two ways to get the adapter from
  * Adapter Registry, one using param: ?submodelId= interactionElements.identification.id and one with
  * semanticId=<submodel.semanticId.keys[0].value
  * @param regRequestParamName the name of the request parameter (submodelId or semanticId )
  * @param submodelIdentification the value passed
  */
  async getAdapterFromRegistry(
    regRequestParamName: string,
    submodelIdentification: string
  ): Promise<IStorageAdapter> {
    var regResponse = await this.webClient.getAdapterFromRegRequest(
      this.registryGETAdaptersURL.href,
      regRequestParamName,
      submodelIdentification,
      this.adapter_reg_user,
      this.adapter_reg_pass
    );

    let adapter = regResponse.data as IStorageAdapter;

    if(adapter.url){
          logger.debug(
      `The submodel with id ${submodelIdentification}, will be routed to ${adapter.url}`
    );
    return adapter;
    }
    else{
      logger.error(
        `The registry did not return a valid url for the adapter `
      );
      throw new Error("Server Error");
    }


  }
}

export {AdapterRegistryConnector}
