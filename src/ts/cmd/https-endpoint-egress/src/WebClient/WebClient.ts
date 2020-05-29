import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import https from 'https'

const logger = require('aas-logger/lib/log');

class WebClient {
  constructor() {}

  async postRequest<T>(
    baseUrl: string,
    bo: string,
    urlSuffix?: string,
    username?: string,
    password?: string,
    cert?: string
  ): Promise<AxiosResponse<T>> {
    let url: string = baseUrl;

    // logger.debug( "[AAS Client] Posting to " + url + " Message: "+ bo);
    logger.debug('[AAS Client] Posting to AAS ' + url);
    //logger.debug(bo);
    var response;
    if (username && password) {
      response = await Axios.post<T>(url, bo, {
        auth: {
          username: username as string,
          password: password as string,
        },
        httpsAgent: new https.Agent({
          ca: cert as string
        }),
      });
    } else {
      response = await Axios.post<T>(url, bo, {
        httpsAgent: new https.Agent({
          ca: cert as string
        }),
      });
    }
    return response as AxiosResponse<T>;
  }
}

export { WebClient };
