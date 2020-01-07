import * as logger from "winston";
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

class WebClient {
  constructor() {}

  private getURLRequestConfig(
    paramName?: string,
    paramValue?: string,
    user?: string,
    pass?: string
  ): AxiosRequestConfig | undefined {
    if (paramName=="submodelId" && user && pass) {
      return {
        params: {
    submodelId: paramValue
        },
        auth: {
          username: user,
          password: pass
        }
      };
    } else if (paramName == "submodelSemanticId" && user && pass) {
      return {
        params: {
          submodelSemanticId: paramValue
        },
        auth: {
          username: user,
          password: pass
        }
      };
    } else if (!paramName && user && pass) {
      return {
        auth: {
          username: user,
          password: pass
        }
      };
    }
    else if (paramName=="submodelSemanticId" && user && pass) {
      return {
  params: {
    submodelSemanticId: paramValue
  },
  auth: {
    username: user,
    password: pass
  }
      };
    }

    else if( !paramName && user && pass) {
      return {
  auth: {
    username: user,
    password: pass
  }
      };
    }
    return undefined;
  }

  async getAdapterFromRegRequest<T>(
    url: string,
    paramName: string,
    param: string,
    username: string,
    password: string
  ): Promise<AxiosResponse<T>> {
    logger.debug("Get request from " + url);
    logger.debug("paramname "+ paramName+"  value " + param);
    logger.debug(" config " + JSON.stringify(this.getURLRequestConfig(paramName, param, username, password)));

    const response = await Axios.get<T>(
      url,
      this.getURLRequestConfig(paramName, param, username, password)
    );
    return response as AxiosResponse<T>;
  }
  //TODO: Consider if it would be better to have one GET req. method with optional
  //parameters to cover both getAdapter from Registry and getSubmodel from Adapter
  async getSubmodelFromAdapterRequest<T>(
    url: string,
    username?: string,
    password?: string
  ): Promise<AxiosResponse<T>> {
    logger.debug("Get request from " + url);

    const response = await Axios.get<T>(
      url,
      this.getURLRequestConfig(username, password)
    );
    return response as AxiosResponse<T>;
  }

  async postSubmodelToAdapterRequest<T>(
    serviceURL: string,
    body: any,
    username?: string,
    password?: string
  ): Promise<AxiosResponse<T>> {
    let url: string = serviceURL;

    logger.debug("POSTing to adapter with url: " + url);

    const response = await Axios.post<T>(url, body, {
      auth: {
        username: username as string,
        password: password as string
      }
    });
    logger.debug("Adapter response " + response.statusText);
    return response as AxiosResponse<T>;
  }
}
export { WebClient };
