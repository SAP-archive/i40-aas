import * as logger from "winston";
import { WebClient } from "../WebClient/WebClient";
import { AxiosResponse } from "axios";
import { IInteractionMessage, IFrame } from "i40-aas-objects";
import {
  RegistryEntry,
  IRegistryEntry,
  IEndpoint
} from "../WebClient/model/RegistryEntryDAO";
import { sendInteractionReplyToAAS } from "./AASConnector";

/*
Implements the logic of how to handle the messages received from the broker.
i.e. asks the Registry App for the endpoints to which the message should be
forwarded to, based on the id or role of the receiver
*/
class RegistryConnector {
  private endpoint_reg_protocol: string;
  private endpoint_reg_host: string;
  private endpoint_reg_port: string;
  private webClient: WebClient;
  private regURL_GET_SUFFIX: string;
  private regAdminUser: string;
  private regAdminPass: string;

  constructor(
    endpoint_reg_protocol: string,
    endpoint_reg_host: string,
    endpoint_reg_port: string,
    regURL_GET_SUFFIX: string,
    regAdminUser: string,
    regAdminPass: string
  ) {
    this.endpoint_reg_protocol = endpoint_reg_protocol;
    this.endpoint_reg_host = endpoint_reg_host;
    this.endpoint_reg_port = endpoint_reg_port;
    this.regURL_GET_SUFFIX = regURL_GET_SUFFIX;
    this.regAdminUser = regAdminUser;
    this.regAdminPass = regAdminPass;


    this.webClient = new WebClient();
  }

  receivedUnintelligibleMessage(message: IInteractionMessage): void {
    throw new Error("Method not implemented.");
  }

  //TODO: there should be a caching of URLs so that not everytime gets pulled from registry
  /*
        look up the endpoints based on the id or role of the receiver
    */
  async getReceiverURLFromRegistry(message: IInteractionMessage) {
    //the GET parameter for the request to registry
    var reqParams: object;
    var response;

    reqParams = {
      receiver: message.frame.receiver,
      semanticprotocol: message.frame.semanticProtocol
    }

    response = await this.webClient.getRequest(
      this.endpoint_reg_protocol,
      this.endpoint_reg_host,
      this.endpoint_reg_port,
      this.regURL_GET_SUFFIX,
      reqParams,
      this.regAdminUser,
      this.regAdminPass
    );

    if (response && "data" in response) {
      logger.debug(
        "Registry Response is " + JSON.stringify(response.data, null, 3)
      );

      this.handleResponseFromRegistry(response, message);
    } else {
      logger.debug("Cannot get a valid response from Registry");
      logger.debug(response);
      throw new Error("Cannot get a valid response from Registry");
    }
  }

  private handleResponseFromRegistry(
    response: AxiosResponse,
    interaction: IInteractionMessage
  ) {
    let registryEntriesArray: IRegistryEntry[] | undefined;

      registryEntriesArray = response.data;
      if (registryEntriesArray) {
        //for every AAS (with AasId,Endpoints[],AssetID set) make a validation if something is missing
        registryEntriesArray.forEach(RegistryEntry => {
          let regEntry = this.validateEssentialRegResultSet(RegistryEntry);

          if (regEntry && this.validateRequired(regEntry)) {
                    //iterate to send to all array endpoints
                    let receiverURLs = regEntry.endpoints;
                    receiverURLs.forEach(URL => {
                    let receiverURL = (URL as IEndpoint).url;

                    logger.info(
                    "[REGISTRY]: ReceiverURL from Registry is " + receiverURL
                    );
                    try {
                    sendInteractionReplyToAAS(receiverURL, interaction);
                    } catch (error) {
                    logger.error(
                    "Error when posting to AAS " +
                    error
                    );
                    throw Error(error);
                    }
                    });
          } else if (regEntry === undefined) {
                    logger.error("[REGISTRY]: ReceiverURL could not be parsed");
          }
        });

        //if response not there
      } else {
        logger.error("[REGISTRY]: Error querring the REGISTRY service");
        this.handleUnactionableMessage(response.data.toString());
        return undefined;
      }

  }

  /**
  * Validation of the Registry Entry
  * @param registryEntry
  */
  private validateEssentialRegResultSet(
    registryEntry: IRegistryEntry
  ): IRegistryEntry | undefined {
    //the registry responds with an array of RegistryEntries

    //the aasid field of the registry response should not be empty
    let essentialData = registryEntry.aasId;
    if (!essentialData) {
      this.handleUnactionableMessage(JSON.stringify(registryEntry), [
        "aasid",
        "endpoints"
      ]);
      return undefined;
    }
    return registryEntry;
  }

  private validateRequired(data: IRegistryEntry): boolean {
    //essential validation passed: receiverID exists
    let endpointObj: IEndpoint | undefined;
    let endpointURL: string | undefined;

    let requiredAndMissingData: string[];
    try {
      endpointObj = data.endpoints[0];

      if (endpointObj) {
        endpointURL = endpointObj.url;

        requiredAndMissingData = [endpointURL].filter(e => e.length === 0);
        if (requiredAndMissingData.length > 0) {
          this.handleUnintelligibleMessage(data, requiredAndMissingData);
          return false;
        }
      } else {
        logger.error("[Registry] No URL for aasid: " + data.aasId.id);
        return false;
      }
    } catch (error) {
      logger.error(
        "Generic error received during validation of required fields:" + error
      );
      return false;
    }
    return true;
  }

  private handleUnintelligibleMessage(
    message: IRegistryEntry,
    missingData: string[]
  ) {
    logger.error(
      "Missing necessary data, " +
        missingData.toString() +
        ", in incoming message:" +
        message
    );
    //TODO: implement error handling method this.msgHandler.receivedUnintelligibleMessage(message);
  }

  private handleUnactionableMessage(message: string, missingData?: string[]) {
    if (missingData) {
      logger.error(
        "Cannot react to this message as the following data, " +
          missingData.toString() +
          ", is missing: " +
          message
      );
    } else {
      logger.error("Cannot react to this unparsable message:" + message);
    }
  }
}
export { RegistryConnector };
