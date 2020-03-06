import * as logger from "winston";
import Axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from "axios";


class WebClient {
  constructor(
    private baseUrl: string,
    private userName?: string,
    private password?: string,

  ) {}

  private auth(): AxiosRequestConfig {
    if (this.userName && this.password) {
      return {
        auth: {
          username: this.userName,
          password: this.password
        }
      };
    } else return {};
  }

  private buildUrl(urlSuffix: string): string {
    return this.baseUrl + urlSuffix;
  }


  async postRequest<T>(urlSuffix: string, bo: any): Promise<AxiosResponse<T>> {
    let url: string = this.buildUrl(urlSuffix);
    logger.debug(
      "Posting to " + url + " with user " + this.userName + " following data: "
    );
    logger.debug(bo);
    const response = await Axios.post<T>(url, bo, this.auth());
    logger.debug("Response:" + JSON.stringify(response.data));
    return response;
  }

}
export { WebClient };
