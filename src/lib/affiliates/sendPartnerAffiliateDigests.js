import debug from 'debug';
import * as Sentry from '@sentry/node';
import { sendBulkTransactional } from '../postmark/index';

const dlog = debug('that:api:garage:lib:sendPartnerAffilateDigests');

export default function sendPartnerAffiliateDigests({
  partnerAffiliates,
  partnerContacts,
  partnerAffiliateOrders,
  digestStart,
  digestEnd,
}) {
  dlog(
    'sendPartnerAffiliateDigests pa: %d, pcids: %d, total orders: %d',
    partnerAffiliates.length,
    partnerContacts.length,
    partnerAffiliateOrders.length,
  );
  const additionalProps = {
    from: 'hello@thatconference.com',
    templateAlias: 'partner-affiliate-digest',
    tag: 'partner-affiliate-digest',
    trackOpens: true,
  };
  const emailsToSend = [];
  for (let i = 0; i < partnerAffiliates.length; i += 1) {
    const affiliate = partnerAffiliates[i];
    const contacts = partnerContacts[i];
    const orders = partnerAffiliateOrders[i];
    const digestOrders = orders.filter(
      o =>
        o.createdAt > digestStart &&
        o.createdAt < digestEnd &&
        o.status === 'COMPLETE',
    );
    if (contacts.length > 0) {
      // create partner email
      const newEmail = {
        ...additionalProps,
        to: contacts.map(c => c.email).join(','),
        templateModel: {
          affiliateCode: affiliate.id,
          affiliateName: affiliate.name,
          rewardPercentage: affiliate?.promoCode?.rewardPercentage ?? 'n/a',
          totalOrders: orders.length ?? 0,
          digestOrders: digestOrders.length ?? 0,
          digestStart,
          digestEnd,
        },
      };

      emailsToSend.push(newEmail);
    } else {
      Sentry.configureScope(scope => {
        scope.setTag('function', 'sendPartnerAffilateDigests');
        scope.setTag('contact count', contacts.length);
        scope.setTag('total order count', orders.length);
        scope.setContext('affiliate', JSON.stringify(affiliate));
        scope.setLevel('warning');
        Sentry.captureMessage(
          `No partner contacts for affliate ${affiliate.id}`,
        );
      });
    }
  }

  // send emails here
  return sendBulkTransactional({ payloads: emailsToSend });
}
