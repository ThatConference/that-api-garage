import debug from 'debug';
import { RESTDataSource } from '@apollo/datasource-rest';
import { security } from '@thatconference/api';
import envConfig from '../../envConfig';

const dlog = debug('that:api:garage:dataSources:rest:bouncer');

class BouncerApi extends RESTDataSource {
  constructor({ authToken }) {
    super();
    this.baseURL = envConfig.bouncerBaseUrl;
    this.authToken = authToken;
  }

  // eslint-disable-next-line class-methods-use-this
  willSendRequest(_path, request) {
    dlog('⚡ willSendRequest:: %o', request);
    dlog('🚯 THIS: %O', this);
    request.headers.authorization = this.authToken;
  }

  async postManualOrderEvent(thatEvent) {
    const signingKey = envConfig.thatRequestSigningKey;
    const thatSigning = security.requestSigning;
    const requestSigning = thatSigning({ signingKey });
    const signature = requestSigning.signRequest(thatEvent);
    if (signature?.isOk !== true || !signature?.thatSig) {
      throw new Error(`unable to sign request: ${signature?.message}`);
    }
    const v4Payload = {
      body: thatEvent,
      headers: {
        'Content-Type': 'application/json',
        'that-request-signature': signature.thatSig,
        'brett-head': 'head/json',
      },
    };
    return this.post('thatmanualorder', v4Payload);
  }
}

export default BouncerApi;
