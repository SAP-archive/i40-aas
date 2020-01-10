import * as logger from "winston";
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

class WebClient {
  constructor() {}
//TODO: remove the hardcoding of params, its also case sensitive!
  private getURLRequestConfig(
    paramName?: string,
    paramValue?: string,
    user?: string,
    pass?: string
  ): AxiosRequestConfig | undefined {
    if (paramName=="submodelid" && user && pass) {
      return {
        params: {
    submodelid: paramValue
        },
        auth: {
          username: user,
          password: pass
        }
      };
    } else if (paramName == "submodelsemanticid" && user && pass) {
      return {
        params: {
          submodelsemanticid: paramValue
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
    else if (paramName=="submodelsemanticid" && user && pass) {
      return {
  params: {
    submodelsemanticid: paramValue
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
    logger.debug("Get request from Registry" + url);
    logger.debug("paramname "+ paramName+"  value " + param);
    logger.debug("Config " + JSON.stringify(this.getURLRequestConfig(paramName, param, username, password)));

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
    logger.debug("Get submodels request from adapter: " + url);

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
