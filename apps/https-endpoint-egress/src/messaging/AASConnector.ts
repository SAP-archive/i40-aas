import * as logger from "winston";
import { WebClient } from "../WebClient/WebClient";
import { AxiosResponse } from "axios";
import { IInteractionMessage, IFrame } from "i40-aas-objects";




  let webClient = new WebClient();
 
 //Send a request to a dummy AAS service (e.g. an operator in case of an onboarding process)
 export async function sendInteractionReplyToAAS(
    receiverURL: string,
    message: IInteractionMessage
  ) {
    let response: AxiosResponse = await webClient.postRequest(
      receiverURL,
      message,
      undefined
      );
      handleResponseFromClientAAS(response,receiverURL);
   return response;
  }

  function handleResponseFromClientAAS(
    response: AxiosResponse,
    receiverURL: string
  ) {
    if (response) {
      if (response.status === 200) {
        logger.info(
          "[AAS Client]: Request success to receiver at " + receiverURL
        );
      } else {
        logger.error(
          "[AAS Client]:  sending Request to AAS Client" + response.status
        );
      }
    } else {
      logger.error("[AAS Client]: Generic Error sending Request to AAS Client");
    }
  }



 
 
 