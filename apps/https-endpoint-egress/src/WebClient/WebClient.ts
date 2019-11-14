import * as logger from "winston";
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";

class WebClient {
  constructor() {}

  /**
   * The GET Request Config for retrieving the Endpoint URLs from Registry
   * @param param
   * @param user
   * @param pass
   */
  private getURLRequestConfig(
    param?: string,
    user?: string,
    pass?: string
  ): AxiosRequestConfig | undefined {
    if (param && user && pass) {
      return {
        params: {
          frame: param
        },
        auth: {
          username: user,
          password: pass
        }
      };
    }
    return undefined;
  }

  private buildUrl(
    protocol: string,
    host: string,
    port: string,
    urlSuffix: string
  ): string {
    return protocol + "://" + host + ":" + urlSuffix;
  }

  async getRequest<T>(
    protocol: string,
    host: string,
    port: string,
    urlSuffix: string,
    param: string,
    username: string,
    password: string
  ): Promise<AxiosResponse<T>> {
    let url: string = this.buildUrl(protocol, host, port, urlSuffix);
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
    baseUrl: string,
    bo: any,
    urlSuffix?: string,
    username?: string,
    password?: string
  ): Promise<AxiosResponse<T>> {
    let url: string = baseUrl;

    logger.debug(
      "[AAS Client] Posting to " + url + " with user  following data:"
    );
    //logger.debug(bo);
    var response;
    if (username && password) {
      response = await Axios.post<T>(url, bo, {
        auth: {
          username: username as string,
          password: password as string
        }
      });
    } else {
      response = await Axios.post<T>(url, bo);
    }
    return response as AxiosResponse<T>;
  }
}

export { WebClient };
