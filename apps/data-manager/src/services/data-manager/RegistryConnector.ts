import * as logger from "winston";
import { Submodel } from "i40-aas-objects";
import { IStorageAdapter } from "./IStorageAdapter";
import { WebClient } from "./WebClient/WebClient";

const dotenv = require("dotenv");
dotenv.config();

let ADAPTER_REG_URL = process.env.ADAPTER_REG_URL;
let ADAPTER_REG_USER = process.env.ADAPTER_REG_USER;
let ADAPTER_REG_PASS = process.env.ADAPTER_REG_PASS;

var webClient = new WebClient();

//get the URL of the adapter from the Adapter registry
async function getAdapterFromRegistry(
  submodelIdShort: string
): Promise<Array<IStorageAdapter>> {
  if (ADAPTER_REG_URL && ADAPTER_REG_USER && ADAPTER_REG_PASS) {
    var regResponse = await webClient.getRequest(
      ADAPTER_REG_URL,
      submodelIdShort,
      ADAPTER_REG_USER,
      ADAPTER_REG_PASS
    );

    let adaptersArray = regResponse.data as IStorageAdapter[];

    adaptersArray.forEach(adapter => {
      //TODO: Validation required
      logger.debug(
        `The submodel with id ${submodelIdShort}, will be routed to ${adapter.url}`
      );
    });

    return adaptersArray;
  } else {
    logger.error(
      " Cannot contact Adapter Registry, Env. Variables are not set "
    );
    throw new Error();
  }
}

export { getAdapterFromRegistry };
