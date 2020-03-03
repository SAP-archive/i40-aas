import * as logger from "winston";
import { WebClient } from "../WebClient/WebClient";
import { AxiosResponse } from "axios";
import { IInteractionMessage, IFrame } from "i40-aas-objects";

let webClient = new WebClient();

//Send a request to a dummy AAS service (e.g. an operator in case of an onboarding process)
export async function sendInteractionReplyToAAS(
  receiverURL: string,
  message: string
) {
 let response: AxiosResponse = await webClient.postRequest(
    receiverURL,
    message,
    undefined
  );
  return response;
}

