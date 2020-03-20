import * as logger from "winston";
import { WebClient } from "../WebClient/WebClient";
import { AxiosResponse } from "axios";
import { IInteractionMessage, IFrame } from "i40-aas-objects";

class AASConnector {
  private webClient: WebClient;

  constructor(wC: WebClient) {
    this.webClient = wC;
  }

  //Send a request to a dummy AAS service (e.g. an operator in case of an onboarding process)
  async sendInteractionReplyToAAS(
    receiverURL: string,
    message: string
  ) {
    let response: AxiosResponse = await this.webClient.postRequest(
      receiverURL,
      message,
      undefined
    );
    return response;
  }
}

export{AASConnector}
