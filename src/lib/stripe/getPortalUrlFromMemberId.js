import debug from 'debug';
import memberlib from '../../dataSources/cloudFirestore/member';
import stripelib from '../../dataSources/apis/stripe';

const dlog = debug('that:api:garage:stripe:getPortalUrlFromMemberId');
const stripe = stripelib();

export default function getPortalUrlFromMemberId({ memberId, firestore }) {
  dlog('getPortalUrlFromMemberId called for %s', memberId);
  let memberStore;
  try {
    memberStore = memberlib(firestore);
  } catch (err) {
    return Promise.reject(err);
  }

  return memberStore.get(memberId).then(member => {
    if (!member) throw new Error('Member not found');
    if (!member.stripeCustomerId)
      throw new Error(`member doesn't have stripe customer id`);
    return stripe.getPortalUrl(member.stripeCustomerId);
  });
}
