import debug from 'debug';
import { RESTDataSource } from 'apollo-datasource-rest';
import { security } from '@thatconference/api';
import envConfig from '../../envConfig';

const dlog = debug('that:api:garage:dataSources:rest:bouncer');

class BouncerApi extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = envConfig.bouncerBaseUrl;
  }

  // eslint-disable-next-line class-methods-use-this
  willSendRequest(request) {
    dlog('willSendRequest:: %o', request);
    request.headers.set('Authorization', this.context.user.authToken);
  }

  async postManualOrderEvent(thatEvent) {
    const signingKey = envConfig.thatRequestSigningKey;
    const thatSigning = security.requestSigning;
    const requestSigning = thatSigning({ signingKey });
    const signature = requestSigning.signRequest(thatEvent);
    if (signature?.isOk !== true || !signature?.thatSig) {
      throw new Error(`unable to sign request: ${signature?.message}`);
    }
    return this.post('thatmanualorder', thatEvent, {
      headers: {
        'Content-Type': 'application/json',
        'that-request-signature': signature.thatSig,
      },
    });
  }
}

export default BouncerApi;
