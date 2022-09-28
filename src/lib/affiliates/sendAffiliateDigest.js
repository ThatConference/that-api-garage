import debug from 'debug';
import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration';
import { dataSources } from '@thatconference/api';
import affiliateStore from '../../dataSources/cloudFirestore/affiliate';
import promoCodeStore from '../../dataSources/cloudFirestore/affiliatePromoCode';
import orderStore from '../../dataSources/cloudFirestore/order';
import sendMemberAffiliateDigests from './sendMemberAffiliateDigests';
import sendPartnerAffiliateDigests from './sendPartnerAffiliateDigests';
import verifySendResponse from '../postmark/verifySendResponse';

const dlog = debug('that:api:garage:lib:sendAffilateDigest');
dayjs.extend(dayjsDuration);
const memberStore = dataSources.cloudFirestore.member;
const partnerStore = dataSources.cloudFirestore.partner;

export default async function sendAffiliateDigest({
  eventId,
  spanInDays,
  firestore,
  userId,
}) {
  dlog('sendAffiliateDigest called %s, days: %d', eventId, spanInDays);

  let digestEnd = dayjs().subtract(1, 'day').endOf('day');
  let digestStart = digestEnd.subtract(spanInDays, 'day').startOf('day');

  digestEnd = digestEnd.toDate();
  digestStart = digestStart.toDate();

  // find all affilates with a promo code for the provided event
  const promoCodes = await promoCodeStore(firestore).findAllPromoCodesForEvent(
    eventId,
  );
  const affiliateIds = promoCodes.map(apc => apc.affiliateId);
  if (affiliateIds.length < 1) {
    return null;
  }
  const affiliates = await affiliateStore(firestore).getBatch(affiliateIds);
  dlog('affiliates found: %d', affiliates.length);

  // separate out member-type and partner-type affiliates
  const [memberAffiliates, partnerAffiliates] = affiliates
    .filter(
      a =>
        !a.referralDigestLastSentOn ||
        dayjs(a.referralDigestLastSentOn) < digestStart,
    )
    .reduce(
      (acc, cur) => {
        dlog('cur: %o', cur);
        const [promoCode] = promoCodes.filter(pc => pc.affiliateId === cur.id);
        // eslint-disable-next-line no-param-reassign
        cur.promoCode = promoCode;
        if (cur.affiliateType === 'MEMBER') {
          acc[0].push(cur);
          return acc;
        }
        if (cur.affiliateType === 'PARTNER') {
          acc[1].push(cur);
          return acc;
        }
        throw new Error(
          `Unknown affiliate type encountered: ${cur.affiliateType}. no messages sent`,
        );
      },
      [[], []],
    );
  dlog(
    'memberAffiliates: %d, partnerAffiliates: %d',
    memberAffiliates.length,
    partnerAffiliates.length,
  );

  let memberAffiliatOrdersFuncs = [];
  let sendToMembersFunc = [];
  if (memberAffiliates.length > 0) {
    // get order results for promo codes
    memberAffiliatOrdersFuncs = memberAffiliates.map(ma =>
      orderStore(firestore).findByPromoCodeEvent({
        promoCode: ma.promoCode.promotionCode,
        eventId,
      }),
    );
    // get member records for name, email address etc.
    sendToMembersFunc = memberStore(firestore).batchFind(
      memberAffiliates.map(ma => ma.referenceId),
    );
  }

  let partnerAffiliatesOrdersFuncs = [];
  let partnerContactFuncs = [];
  if (partnerAffiliates.length > 0) {
    // get order results for promo codes
    partnerAffiliatesOrdersFuncs = partnerAffiliates.map(pa =>
      orderStore(firestore).findByPromoCodeEvent({
        promoCode: pa.promoCode.promotionCode,
        eventId,
      }),
    );
    // find all partner's primary contacts
    partnerContactFuncs = partnerAffiliates.map(pa =>
      partnerStore(firestore).findPartnerPrimaryContacts(pa.referenceId),
    );
  }

  // SO IS THIS A GOOD IDEA? I MEAN IS SHOULD WORK and we have lots of requests
  const [
    memberAffiliateOrders,
    partnerAffiliateOrders,
    sendToMembers,
    partnerContactIds,
  ] = await Promise.all([
    Promise.all(memberAffiliatOrdersFuncs),
    Promise.all(partnerAffiliatesOrdersFuncs),
    sendToMembersFunc,
    Promise.all(partnerContactFuncs),
  ]);
  // affiliate member element count check
  if (memberAffiliates.length !== memberAffiliateOrders.length) {
    throw new Error(
      `memberAffiliates, memberAffiliateOrders element count mismatch: ${memberAffiliates.length}, ${memberAffiliateOrders.length}`,
    );
  }

  // get member records for partner contacts
  let partnerMemberFuncs = [];
  if (partnerContactIds.length > 0) {
    partnerMemberFuncs = partnerContactIds.map(ids =>
      memberStore(firestore).batchFind(ids),
    );
  }
  const partnerContacts = await Promise.all(partnerMemberFuncs);
  // Affiliate partner element count check
  if (
    partnerAffiliates.length !== partnerAffiliateOrders.length ||
    partnerAffiliates.length !== partnerContacts.length
  ) {
    throw new Error(
      `partnerAffilates, partnerAffiliateOrders, partnerContacts element count mismatch: ${partnerAffiliates.length}, ${partnerAffiliateOrders.length}, ${partnerContacts.length}. No emails sent.`,
    );
  }
  // send digests to member-type Affiliates
  // send digests to partner-type affiliates
  const [memberAffiliateResults, partnerAffiliateResults] = await Promise.all([
    sendMemberAffiliateDigests({
      memberAffiliates,
      sendToMembers,
      memberAffiliateOrders,
      digestStart,
      digestEnd,
    }),
    sendPartnerAffiliateDigests({
      partnerAffiliates,
      partnerContacts,
      partnerAffiliateOrders,
      digestStart,
      digestEnd,
    }),
  ]);
  // dlog(
  //   'postmark results: member: %o, partner: %o',
  //   memberAffiliateResults,
  //   partnerAffiliateResults,
  // );

  const memberEmailResult = verifySendResponse({
    postmarkResponses: memberAffiliateResults,
  });
  const partnerEmailResult = verifySendResponse({
    postmarkResponses: partnerAffiliateResults,
  });

  // update affilate records
  const affiliateUpdates = [];
  memberAffiliates.forEach(ma =>
    affiliateUpdates.push({
      id: ma.id,
      referralDigestLastSentOn: digestEnd,
    }),
  );
  partnerAffiliates.forEach(pa =>
    affiliateUpdates.push({
      id: pa.id,
      referralDigestLastSentOn: digestEnd,
    }),
  );
  dlog('updating %d affiliates for sent digests', affiliateUpdates.length);
  const affiliateUpdateResult = await affiliateStore(firestore).batchUpdate({
    affiliateUpdates,
    userId,
  });

  return JSON.stringify({
    eventId,
    totalEventAffiliates: promoCodes.length,
    memberSentAffiliateCount: memberAffiliates.length,
    partnerSentAffiliateCount: partnerAffiliates.length,
    isMemberEmailInError: memberEmailResult.hasErrors,
    isPartnerEmailInError: partnerEmailResult.hasErrors,
    isAffiliateUpdateSuccessful: affiliateUpdateResult,
  });
}
