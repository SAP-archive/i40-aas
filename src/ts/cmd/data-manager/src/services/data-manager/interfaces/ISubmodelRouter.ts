import { Submodel } from "i40-aas-objects";
import { AxiosResponse } from "axios";

interface ISubmodelRouter {
  routeSubmodel(submodel: Submodel): Promise<AxiosResponse>;
  initAdapterConnector(): void;
  initEndpointRegistryConnector(): void;
}
export {ISubmodelRouter};
