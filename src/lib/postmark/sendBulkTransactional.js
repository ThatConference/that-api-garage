import debug from 'debug';
import { Client as Postmark } from 'postmark';
import envConfig from '../../envConfig';

const postmark = new Postmark(envConfig.postmarkApiToken);
const dlog = debug('that:api:garage:postmark:sendBulkTransactional');

/* expected payload
 [
  {
    from: '',
    to: '',
    tag: '',
    templateAlias: '',
    templateModel: {},
    trackOpens: true,
  }
 ]
 */

export default function sendBulkTransactional({ payloads }) {
  dlog('postmark sendTransactional called with %d payloads', payloads?.length);
  if (payloads?.length > 500) {
    throw new Error(
      `max email batch size is 500 messages you sent ${payloads?.length}`,
    );
  }

  const messages = payloads.map(message => {
    const m = message;
    if (!m?.from) m.from = 'hello@thatconference.com';
    return m;
  });

  // postmark max per batch, 500
  return postmark.sendEmailBatchWithTemplates(messages);
}
