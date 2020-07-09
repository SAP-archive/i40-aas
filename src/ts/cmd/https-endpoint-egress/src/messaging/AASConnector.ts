import { WebClient } from '../WebClient/WebClient';
import { AxiosResponse } from 'axios';

const logger = require('aas-logger/lib/log');

class AASConnector {
  private webClient: WebClient;

  constructor(wC: WebClient) {
    this.webClient = wC;
  }

  //Send a request to a AAS service (e.g. an operator in case of an onboarding process)
  async sendInteractionReplyToAAS(receiverURL: string, message: string, user?:string, password?: string, tlsCert?: string) {
    let response: AxiosResponse = await this.webClient.postRequest(
      receiverURL,
      message,
      user,
      password,
      tlsCert
    );

    return response;
  }
}

export { AASConnector };
