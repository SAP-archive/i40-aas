import * as logger from "winston";
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";


class WebClient {
  constructor() {}

  private getURLRequestConfig(
    param?: string,
    user?: string,
    pass?: string
  ): AxiosRequestConfig | undefined {
    if (param && user && pass) {
      return {
        params: {
          submodelidshort: param
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
    baseUrl: string,
    param: string,
    username: string,
    password: string
  ): Promise<AxiosResponse<T>> {

    let url: string = baseUrl;
    logger.debug("Get request from " + url);
    logger.debug("param " + param);
    // logger.debug(
    // "req config " +
    // JSON.stringify(this.getURLRequestConfig(param, username, password))
    // );

  const response = await Axios.get<T>(
    url,
    this.getURLRequestConfig(param, username, password)
  );
  return response as AxiosResponse<T>;

  }

  async postRequest<T>(
    serviceURL: string,
    bo: any,
    urlSuffix?: string,
    username?: string,
    password?: string
  ): Promise<AxiosResponse<T>> {
    let url: string = serviceURL;
    
    logger.debug("POSTing to adapter with url: " + url);

    const response = await Axios.post<T>(url, bo, {
      auth: {
        username: username as string,
        password: password as string
      }
    });
    logger.debug("Adapter response "+ response.statusText)
    return response as AxiosResponse<T>;
  }
}
export { WebClient };
