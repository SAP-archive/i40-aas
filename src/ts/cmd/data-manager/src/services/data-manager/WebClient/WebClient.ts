import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';

const logger = require('aas-logger/lib/log');

class WebClient {
  constructor() {}
  //TODO: remove the hardcoding of params, its also case sensitive!
  private getURLRequestConfig(
    params?: object,
    user?: string,
    pass?: string
  ): AxiosRequestConfig {
    let config: AxiosRequestConfig = {};

    if (params) {
      config.params = params;
    }
    if (user && pass) {
      config.auth = {
        username: user,
        password: pass,
      };
    }
    return config;
  }

  async getAdapterFromRegRequest<T>(
    url: string,
    params: object,
    username: string,
    password: string
  ): Promise<AxiosResponse<T>> {
    logger.debug('Get request from Registry' + url);
    logger.debug('paraams ', params);
    logger.debug('Config ' + JSON.stringify(this.getURLRequestConfig(params)));

    const response = await Axios.get<T>(
      url,
      this.getURLRequestConfig(params, username, password)
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
    logger.debug('Get submodels request from adapter: ' + url);

    const response = await Axios.get<T>(
      url,
      this.getURLRequestConfig(undefined, username, password)
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

    logger.debug('POSTing to adapter with url: ' + url);

    const response = await Axios.post<T>(url, body, {
      auth: {
        username: username as string,
        password: password as string,
      },
    });
    logger.debug('Adapter response ' + response.statusText);
    return response as AxiosResponse<T>;
  }
}
export { WebClient };
