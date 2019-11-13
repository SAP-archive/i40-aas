import * as logger from "winston";
import { Submodel } from "i40-aas-objects";
import { IStorageAdapter } from "./IStorageAdapter";
import { WebClient } from "./WebClient/WebClient";

const dotenv = require("dotenv");
dotenv.config();

let ADAPTER_REGISTRY_BASE_URL = process.env.ADAPTER_REGISTRY_BASE_URL;
let ADAPTER_REG_ADMIN_USER = process.env.ADAPTER_REG_ADMIN_USER;
let ADAPTER_REG_ADMIN_PASS = process.env.ADAPTER_REG_ADMIN_PASS;
let ADAPTER_REGISTRY_BASE_URL_GET_ADAPTER_SUFFIX = process.env.ADAPTER_REGISTRY_BASE_URL_GET_ADAPTER_SUFFIX;
var webClient = new WebClient();

//get the URL of the adapter from the Adapter registry
async function getAdapterFromRegistry(
  submodelIdShort: string
): Promise<IStorageAdapter> {
  if (ADAPTER_REGISTRY_BASE_URL && ADAPTER_REGISTRY_BASE_URL_GET_ADAPTER_SUFFIX && ADAPTER_REG_ADMIN_USER && ADAPTER_REG_ADMIN_PASS) {
    var regResponse = await webClient.getRequest(
      ADAPTER_REGISTRY_BASE_URL,
      ADAPTER_REGISTRY_BASE_URL_GET_ADAPTER_SUFFIX,
      submodelIdShort,
      ADAPTER_REG_ADMIN_USER,
      ADAPTER_REG_ADMIN_PASS
    );

    let adapter = regResponse.data as IStorageAdapter;

      //TODO: Validation required
      logger.debug(
        `The submodel with id ${submodelIdShort}, will be routed to ${adapter.url}`
      );
  
    return adapter;
  } else {
    logger.error(
      " Cannot contact Adapter Registry, Env. Variables are not set "
    );
    throw new Error();
  }
}

export { getAdapterFromRegistry };
