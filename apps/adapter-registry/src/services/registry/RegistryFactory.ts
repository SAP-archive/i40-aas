const { Pool } = require("pg");
const genericPool = require("generic-pool");
import { Registry } from "./AdapterRegistryLocal";
import * as logger from "winston";
 

class RegistryFactory {

  static async getRegistryLocal(): Promise<Registry> {
    var storage = require("node-persist");

    await storage.init( /* options ... */ );
    //logger.debug("Local storage initialized ");

    return new Registry(storage);
  }
}
export { RegistryFactory };
