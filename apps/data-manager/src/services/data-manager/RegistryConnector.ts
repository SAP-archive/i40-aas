import * as logger from "winston";
import { Submodel } from "i40-aas-objects";
import { IStorageAdapter } from "./interfaces/IStorageAdapter";
import { WebClient } from "./WebClient/WebClient";

const dotenv = require("dotenv");
dotenv.config();

class AdapterRegistryConnector {
  private webClient: WebClient;
  private adapter_reg_protocol: string;
  private adapter_reg_host: string;
  private adapter_reg_port: string;
  private adapter_reg_suffix:string;
  private adapter_reg_user: string;
  private adapter_reg_pass: string;

  constructor(
    wC: WebClient,
    adapter_reg_protocol: string,
    adapter_reg_host: string,
    adapter_reg_port: string,
    adapter_reg_suffix:string,
    adapter_reg_user: string,
    adapter_reg_pass: string
  ) {
    this.webClient = wC;
    this.adapter_reg_protocol = adapter_reg_protocol;
    this.adapter_reg_host = adapter_reg_host;
    this.adapter_reg_port = adapter_reg_port;
    this.adapter_reg_suffix = adapter_reg_suffix;
    this.adapter_reg_user = adapter_reg_user;
    this.adapter_reg_pass = adapter_reg_pass;
  }

  //get the URL of the adapter from the Adapter registry
  async getAdapterFromRegistry(
    submodelIdShort: string
  ): Promise<IStorageAdapter> {
    var regResponse = await this.webClient.getRequest(
      this.adapter_reg_protocol,
      this.adapter_reg_host,
      this.adapter_reg_port,
      this.adapter_reg_suffix,
      submodelIdShort,
      this.adapter_reg_user,
      this.adapter_reg_pass
    );
    logger.debug("adapter "+JSON.stringify(regResponse.data));

    let adapter = regResponse.data as IStorageAdapter;

    //TODO: Validation required
    logger.debug(
      `The submodel with id ${submodelIdShort}, will be routed to ${adapter.url}`
    );

    return adapter;
  }
}

export {AdapterRegistryConnector}
