import { ISubmodelRouter } from "./interfaces/ISubmodelRouter";
import { AdapterRegistryConnector } from "./RegistryConnector";
import { AdapterConnector } from "./AdapterConnector";
import { logger } from "../../utils/log";
import { AxiosResponse } from "axios";
import { IStorageAdapter } from "./interfaces/IStorageAdapter";
import { Submodel } from "i40-aas-objects";

module RoutingController {
  var adapterConn: AdapterConnector;
  var registryConn: AdapterRegistryConnector;

  export async function routeSubmodel(
    submodel: Submodel
  ): Promise<AxiosResponse> {
    let sM = submodel;
    //get the storage adapter responsible for this model from adapter-registry
    if (adapterConn && registryConn) {
      let adapter: IStorageAdapter = await registryConn.getAdapterFromRegistry(
        sM.idShort
      );
      logger.debug("Adapter " + JSON.stringify(adapter));

      let result = await adapterConn.postSubmoduleToAdapter(submodel, adapter);
      return result;
    } else {
      logger.error(" Adapter or Registry connector not initialised");
      throw new Error(" Internal Server Error");
    }
  }

  export function initController(
    rC: AdapterRegistryConnector,
    aC: AdapterConnector
  ) {
    registryConn = rC;
    adapterConn = aC;
  }
}

export { RoutingController };
