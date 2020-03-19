import { WebClient } from '../../web/WebClient';
import { AxiosResponse } from 'axios';
import { logger } from '../../log';

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
