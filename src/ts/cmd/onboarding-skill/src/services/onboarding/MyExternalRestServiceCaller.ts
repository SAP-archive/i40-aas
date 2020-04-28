import { WebClient } from '../../web/WebClient';
import { AxiosResponse } from 'axios';

const logger = require('aas-logger/lib/log');

class MyExternalRestServiceCaller {
  constructor(
    private webClient: WebClient,
    private dataManagerUrlSuffix: string
  ) {}
  async createInstanceOnCAR(submodels: object[]): Promise<AxiosResponse> {
    logger.debug('MessageDispatcher:createInstanceOnCAR called');
    return this.webClient.postRequest(this.dataManagerUrlSuffix, submodels); //TODO:await?
  }
}

export { MyExternalRestServiceCaller };
