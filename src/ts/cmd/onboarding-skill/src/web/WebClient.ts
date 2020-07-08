import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import tls from 'tls';
import https from 'https';

const logger = require('aas-logger/lib/log');

class WebClient {
  constructor(
    private baseUrl: string,
    private userName?: string,
    private password?: string,
    private cert?: string
  ) {}

  private auth(): AxiosRequestConfig {
    if (this.userName && this.password) {
      return {
        auth: {
          username: this.userName,
          password: this.password,
        },
        httpsAgent: new https.Agent({
          ca: this.cert as string
        }),
      };
    } else return {
      httpsAgent: new https.Agent({
        ca: this.cert as string
      }),
    };
  }

  private buildUrl(urlSuffix: string): string {
    return this.baseUrl + urlSuffix;
  }

  async postRequest<T>(urlSuffix: string, bo: any): Promise<AxiosResponse<T>> {
    let url: string = this.buildUrl(urlSuffix);
    logger.debug(
      'Posting to ' + url + ' with user ' + this.userName + ' following data: '
    );
    logger.debug(JSON.stringify(bo));
    const response = await Axios.post<T>(url, bo, this.auth());
    logger.debug('Response:' + JSON.stringify(response.data));
    return response;
  }
}
export { WebClient };
