import * as logger from "winston";
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

class WebClient {
  constructor() {}

  private getURLRequestConfig(
    paramName?:string,
    paramValue?: string,
    user?: string,
    pass?: string
  ): AxiosRequestConfig | undefined {
    if (paramName && user && pass) {
      return {
        params: {
          paramName: paramValue
        },
        auth: {
          username: user,
          password: pass
        }
      };
    }
    return undefined;
  }



  async getRequest<T>(
    url: string,
paramName: string,
    param: string,
    username: string,
    password: string
  ): Promise<AxiosResponse<T>> {
    logger.debug("Get request from " + url);
    logger.debug("param " + param);

    const response = await Axios.get<T>(
      url,
      this.getURLRequestConfig(paramName, param, username, password)
    );
    return response as AxiosResponse<T>;
  }

  async postRequest<T>(
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
