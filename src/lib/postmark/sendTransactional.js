import debug from 'debug';
import { Client as Postmark } from 'postmark';
import envConfig from '../../envConfig';

const postmark = new Postmark(envConfig.postmarkApiToken);
const dlog = debug('that:api:garage:postmark:sendTransactional');

export default function sendTransactional({
  mailTo,
  mailFrom = 'hello@thatconference.com',
  templateAlias,
  templateModel,
  additionalProps = {},
}) {
  dlog('postmark sendTransactional called');
  if (!mailTo || !templateAlias) {
    return Promise.reject(
      new Error('mailTo and templateAlias are required parameters'),
    );
  }

  let TemplateModel = {};
  if (templateModel && Object.keys(templateModel).length > 0)
    TemplateModel = templateModel;

  return postmark.sendEmailWithTemplate({
    TemplateAlias: templateAlias,
    From: mailFrom,
    To: mailTo,
    TemplateModel,
    ...additionalProps,
  });
}
