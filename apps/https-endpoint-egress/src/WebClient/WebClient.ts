import * as logger from "winston";
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";
import boom = require("boom");

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

  private buildUrl(baseUrl: string, urlSuffix: string): string {
    return "http://" + baseUrl + urlSuffix;
  }

  async getRequest<T>(
    baseUrl: string,
    urlSuffix: string,
    param: string,
    username: string,
    password: string
  ): Promise<AxiosResponse<T>> {
    let url: string = this.buildUrl(baseUrl, urlSuffix);
    logger.debug("Get request from " + url);
    logger.debug("param " + param);
    // logger.debug(
      // "req config " +
        // JSON.stringify(this.getURLRequestConfig(param, username, password))
    // );

    const response = await Axios.get<T>(
      url,
      this.getURLRequestConfig(param, username, password)
    ).catch(function(error) {
      if (error.response) {
        logger.error("[REGISTRY] Response error " + error.response.data);
        logger.error(error.response.status);
        logger.error(error.response.headers);
        if (error.response.status == 401) {
          throw boom.unauthorized(
            "The provided credentials were not accepted by the Registry"
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        logger.error("[REGISTRY] Request error " + error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error("[REGISTRY] HTTP Request Error " + error.message);
        logger.debug("No JSON received from Registry Service");
      throw boom.badImplementation("No JSON received from the Registry.");
      }
      logger.error(error.config);
    });

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
    //in case there is a suffix
    if (urlSuffix) url = this.buildUrl(baseUrl, urlSuffix);

    logger.debug("[AAS Client] Posting to " + url + " with user  following data:");
    //logger.debug(bo);
    var response;
    if(username&&password){
       response = await Axios.post<T>(
        url,
        bo,
        {
          auth:{
          username: username as string,
          password: password as string
        }}
      )
    }else{
    response = await Axios.post<T>(
      url,
      bo);
    }
return response as AxiosResponse<T>;
}}

export { WebClient };
