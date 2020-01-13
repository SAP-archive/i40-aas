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
    submodelsArray: Submodel[]
  ): Promise<AxiosResponse[]> {
    var submodels = submodelsArray.map(async submodel => {
      //get the storage adapter responsible for this model from adapter-registry
      //try first with submodelId === interactionElements.identification.id as parameter
      if (adapterConn && registryConn) {
        let adapter: IStorageAdapter = await registryConn.getAdapterFromRegistry(
          "submodelid",
          submodel.identification.id
        );
        logger.debug("Adapter " + JSON.stringify(adapter));

        //if no mapping for adapter using the identification.id was found in the registry, try getting an adapter using semanticId
        if (!adapter.url && submodel.semanticId) {
          if (submodel.semanticId.keys[0].value) {
            let adapter: IStorageAdapter = await registryConn.getAdapterFromRegistry(
              "submodelsemanticid",
              submodel.semanticId.keys[0].value
            );
          }
        }
        let result = await adapterConn.postSubmoduleToAdapter(
          submodel,
          adapter
        );
        return result;
      } else {
        logger.error(" Adapter or Registry connector not initialised");
        throw new Error(" Internal Server Error");
      }
    });

    return Promise.all(submodels);
  }
  export async function getSubmodels(paramName: string, paramValue: string) {
    if (adapterConn && registryConn) {
      let adapter: IStorageAdapter = await registryConn.getAdapterFromRegistry(
        paramName,
        paramValue
      );

      logger.debug("Adapter to the submodel from: " + JSON.stringify(adapter));
      let result = await adapterConn.getSubmoduleFromAdapter(adapter);
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
