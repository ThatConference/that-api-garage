import debug from 'debug';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:garage:datasources:firebase:members');
const { entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['createdAt', 'lastUpdatedAt', 'membershipExpirationDate'];
const memberDateForge = entityDateForge({ fields: forgeFields });

const collectionName = 'members';

const member = dbInstance => {
  dlog('instance created');

  const memberCollection = dbInstance.collection(collectionName);

  function get(memberId) {
    dlog('get %s', memberId);
    return memberCollection
      .doc(memberId)
      .get()
      .then(docSnapshot => {
        let result = null;
        if (docSnapshot.exists) {
          result = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };
          result = memberDateForge(result);
        }

        return result;
      });
  }

  function setSecureTypename(setMember) {
    const localMember = setMember;
    let typename = 'PrivateProfile';
    if (setMember.canFeature) typename = 'PublicProfile';
    localMember.__typename = typename;
    return localMember;
  }

  function getIdType(memberId) {
    return get(memberId).then(m => {
      let typename = 'PrivateProfile';
      if (m.canFeature) typename = 'PublicProfile';
      return {
        id: m.id,
        __typename: typename,
      };
    });
  }

  function getSecureBatch(ids) {
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');
    dlog('member getBatch called %d ids', ids.length);
    const docRefs = ids.map(id => memberCollection.doc(id));
    return dbInstance.getAll(...docRefs).then(docs =>
      docs.map(doc => {
        let result = null;
        if (doc.exists) {
          const memberData = {
            id: doc.id,
            ...doc.data(),
          };
          result = {
            id: memberData.id,
            __typename:
              memberData.canFeature === true
                ? 'PublicProfile'
                : 'PrivateProfile',
          };
        }
        return result;
      }),
    );
  }

  async function update({ memberId, profile }) {
    dlog('update %s', memberId);
    const docRef = memberCollection.doc(memberId);
    const moddedProfile = profile;
    moddedProfile.lastUpdatedAt = new Date();
    await docRef.update(moddedProfile);

    return get(memberId);
  }

  function findByEmail(emailAddress) {
    dlog('findByEmail called for, %s', emailAddress);
    return memberCollection
      .where('email', '==', emailAddress)
      .get()
      .then(qrySnap =>
        qrySnap.docs.map(d => {
          const result = {
            id: d.id,
            ...d.data(),
          };
          setSecureTypename(result);
          return memberDateForge(result);
        }),
      );
  }

  return {
    get,
    setSecureTypename,
    getIdType,
    getSecureBatch,
    update,
    findByEmail,
  };
};

export default member;
