import tls from 'tls';
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import https from 'https'

const logger = require('aas-logger/lib/log');

class WebClient {
  constructor() {}

  async postRequest<T>(
    baseUrl: string,
    body: string,
    urlSuffix?: string,
    username?: string,
    password?: string,
    cert?: string
  ): Promise<AxiosResponse<T>> {
    let url: string = baseUrl;

    logger.debug( "[AAS Client] Posting to AAS ingress at " + url + " message: "+ JSON.stringify(body));

    var response;
    if (username && password) {
      response = await Axios.post<T>(url, body, {
        auth: {
          username: username as string,
          password: password as string,
        }
      });
    } else {
      response = await Axios.post<T>(url, body);
    }
    return response as AxiosResponse<T>;
  }
}

export { WebClient };
