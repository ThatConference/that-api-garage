import debug from 'debug';
import { RESTDataSource } from 'apollo-datasource-rest';
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
    return this.post('thatmanualorder', thatEvent, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export default BouncerApi;
