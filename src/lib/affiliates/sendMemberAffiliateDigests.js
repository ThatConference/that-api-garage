import debug from 'debug';
import * as Sentry from '@sentry/node';
import { sendBulkTransactional } from '../postmark/index';

const dlog = debug('that:api:garage:lib:sendMemberAffilateDigests');

export default function sendMemberAffiliateDigests({
  memberAffiliates,
  sendToMembers,
  memberAffiliateOrders,
  digestStart,
  digestEnd,
}) {
  dlog(
    'sendMemberAffilateDigests called ma: %d, m: %d',
    memberAffiliates.length,
    sendToMembers.length,
  );
  const additionalProps = {
    from: 'hello@thatconference.com',
    templateAlias: 'member-affiliate-digest',
    tag: 'member-affiliate-digest',
    trackOpens: true,
  };
  const emailsToSend = [];
  // build email objects
  for (let i = 0; i < memberAffiliates.length; i += 1) {
    const memberAffiliate = memberAffiliates[i];
    const member = sendToMembers[i];
    const orders = memberAffiliateOrders[i];
    const digestOrders = orders.filter(
      o =>
        o.createdAt > digestStart &&
        o.createdAt < digestEnd &&
        o.status === 'COMPLETE',
    );
    if (member?.email) {
      const newEmail = {
        ...additionalProps,
        to: member.email,
        templateModel: {
          member: {
            firstName: member.firstName,
            lastName: member.lastName,
          },
          affiliateCode: memberAffiliate.id,
          rewardPercentage:
            memberAffiliate?.promoCode?.rewardPercentage ?? 'n/a',
          totalOrders: orders.length ?? 0,
          digestOrders: digestOrders.length ?? 0,
          digestStart,
          digestEnd,
        },
      };

      emailsToSend.push(newEmail);
    } else {
      Sentry.configureScope(scope => {
        scope.setTag('function', 'sendMemberAffiliateDigests');
        scope.setLevel('warning');
        scope.setContext('memberAffiliate', JSON.stringify(memberAffiliate));
        Sentry.captureMessage(
          `No member record found for member affilite ${memberAffiliate.id}`,
        );
      });
    }
  }

  return sendBulkTransactional({ payloads: emailsToSend });
}
