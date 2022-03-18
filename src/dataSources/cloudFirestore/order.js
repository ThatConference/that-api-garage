import debug from 'debug';
import { utility } from '@thatconference/api';
import * as Sentry from '@sentry/node';
import constants from '../../constants';

const dlog = debug('that:api:garage:datasources:firebase:order');
const { orderAllocations: allocationDateForge, orders: orderDateForge } =
  utility.firestoreDateForge;

const collectionName = 'orders';
const collectionAllocationName = 'orderAllocations';

const scrubOrder = ({ order, isNew, userId }) => {
  dlog('scrubOrder called');
  const scrubbedOrder = order;
  const thedate = new Date();
  if (isNew) {
    scrubbedOrder.createdAt = thedate;
    scrubbedOrder.createdBy = userId;
  }
  scrubbedOrder.lastUpdatedAt = thedate;
  scrubbedOrder.lastUpdatedBy = userId;

  return scrubbedOrder;
};

const scrubOrderAllocation = ({ orderAllocation, userId }) => {
  dlog('scrubOrderAllocation called');
  const scrubbedOa = orderAllocation;
  scrubbedOa.lastUpdatedAt = new Date();
  scrubbedOa.lastUpdatedBy = userId;

  return scrubbedOa;
};

const order = dbInstance => {
  dlog('instance created');

  const orderCollection = dbInstance.collection(collectionName);
  const allocationCollection = dbInstance.collection(collectionAllocationName);

  function get(id) {
    dlog('get called %s', id);
    return orderCollection
      .doc(id)
      .get()
      .then(doc => {
        let result = null;
        if (doc.exists) {
          result = {
            id: doc.id,
            ...doc.data(),
          };
          result = orderDateForge(result);
        }
        return result;
      });
  }

  function getBatch(ids) {
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');
    dlog('getBatch called %d ids', ids.length);
    return Promise.all(ids.map(id => get(id)));
  }

  async function getPaged({ pageSize, cursor, eventId }) {
    dlog('get page called');
    let query = orderCollection
      .orderBy('createdAt', 'desc')
      .limit(pageSize || 20);

    if (cursor) {
      const curObject = Buffer.from(cursor, 'base64').toString('utf8');
      const { curCreatedAt, curEventId } = JSON.parse(curObject);
      // where() must come before startAfter()/startAt()
      if (eventId && curEventId !== eventId)
        throw new Error('Invalid cursor provided');
      if (curEventId) query = query.where('event', '==', curEventId);
      if (!curCreatedAt) throw new Error('Invalid cursor provided');
      query = query.startAfter(new Date(curCreatedAt));
    } else if (!cursor && eventId) {
      query = query.where('event', '==', eventId);
    }
    const { size, docs } = await query.get();
    dlog('found %d records', size);

    const orders = docs.map(doc => {
      const r = {
        id: doc.id,
        ...doc.data(),
      };
      return orderDateForge(r);
    });

    const lastdoc = orders[orders.length - 1];
    let newCursor = '';
    if (lastdoc) {
      dlog('lastdoc:: %o', lastdoc);
      // one millisecond needs to be removed for descending timestamp paging
      const curCreatedAt = new Date(lastdoc.createdAt.getTime() - 1);
      const cpieces = JSON.stringify({
        curCreatedAt,
        curEventId: eventId || '',
      });
      newCursor = Buffer.from(cpieces, 'utf8').toString('base64');
    }

    return {
      orders,
      cursor: newCursor,
      count: orders.length,
    };
  }

  function findByEvent(eventId) {
    dlog('finding orders for event %s', eventId);
    return orderCollection
      .where('event', '==', eventId)
      .get()
      .then(querySnap =>
        querySnap.docs
          .map(doc => {
            const r = {
              id: doc.id,
              ...doc.data(),
            };

            return orderDateForge(r);
          })
          .sort((a, b) => {
            if (a.orderDate.getTime() > b.orderDate.getTime()) return 1;
            if (a.orderDate.getTime() < b.orderDate.getTime()) return -1;
            return 0;
          }),
      );
  }

  function getMe({ user, orderId }) {
    dlog(`get ${orderId} for user ${user.sub}`);
    return orderCollection
      .doc(orderId)
      .get()
      .then(doc => {
        let result = null;
        if (doc.exists) {
          result = {
            id: doc.id,
            ...doc.data(),
          };
          result = orderDateForge(result);
          if (result.member !== user.sub) result = null;
        }
        return result;
      });
  }

  async function getPagedMe({ user, pageSize, cursor }) {
    dlog(`getPagedMe called with pagesize %d`, pageSize);
    if (pageSize > 100)
      throw new Error('Max page size of 100 exceeded, %d', pageSize);

    let query = orderCollection
      .orderBy('createdAt', 'desc')
      .where('member', '==', user.sub)
      .limit(pageSize || 20);

    if (cursor) {
      const curObject = Buffer.from(cursor, 'base64').toString('utf8');
      const { curCreatedAt, curMember } = JSON.parse(curObject);
      if (curMember !== user.sub) throw new Error('Invalid cursor profived');
      if (!curCreatedAt) throw new Error('Invalid cursor provided');
      query = query.startAfter(new Date(curCreatedAt));
    }
    const { size, docs } = await query.get();
    dlog('found %d records', size);

    const orders = docs.map(doc => {
      const r = {
        id: doc.id,
        ...doc.data(),
      };
      return orderDateForge(r);
    });

    const lastdoc = orders[orders.length - 1];
    let newCursor = '';
    if (lastdoc) {
      const curCreatedAt = new Date(lastdoc.createdAt.getTime() - 1);
      const cpieces = JSON.stringify({
        curCreatedAt,
        curMember: user.sub,
      });
      newCursor = Buffer.from(cpieces, 'utf8').toString('base64');
    }

    return {
      orders,
      cursor: newCursor,
      count: orders.length,
    };
  }

  async function create({ newOrder, user }) {
    dlog('create called');
    const scrubbedOrder = scrubOrder({
      order: newOrder,
      isNew: true,
      userId: user.sub,
    });
    const newDoc = await orderCollection.add(scrubbedOrder);

    return get(newDoc.id);
  }

  async function update({ orderId, upOrder, user }) {
    dlog(`updated called for %s by %s`, orderId, user.sub);
    const scrubbedOrder = scrubOrder({
      order: upOrder,
      userId: user.sub,
    });
    const docRef = orderCollection.doc(orderId);
    await docRef.update(scrubbedOrder);

    return get(docRef.id);
  }

  function getOrderAllocation(orderAllocationId) {
    dlog('getOrderAllocation called for %s', orderAllocationId);

    return allocationCollection
      .doc(orderAllocationId)
      .get()
      .then(docSnap => {
        let result = null;
        if (docSnap.exists) {
          result = {
            id: docSnap.id,
            ...docSnap.data(),
          };
        }
        return allocationDateForge(result);
      });
  }

  function updateOrderAllocation({
    orderAllocationId,
    updateAllocation,
    user,
  }) {
    dlog(`updateOrderAllocation called on %s`, orderAllocationId);
    const scrubbedOa = scrubOrderAllocation({
      orderAllocation: updateAllocation,
      userId: user.sub,
    });
    const docRef = allocationCollection.doc(orderAllocationId);
    return docRef
      .update(scrubbedOa)
      .then(() => ({ id: orderAllocationId }))
      .catch(err => {
        const exId = Sentry.captureException(err);
        throw new Error(`Order Allocation Exception: ${exId}`);
      });
  }

  function findOrderAllocations({ orderId }) {
    dlog(`findOrderAllocations called for order %s`, orderId);
    return allocationCollection
      .where('order', '==', orderId)
      .get()
      .then(querySnap =>
        querySnap.docs.map(d => {
          const r = {
            id: d.id,
            ...d.data(),
          };
          return allocationDateForge(r);
        }),
      );
  }

  function findOrderAllocationsForEvent({ eventId, enrollmentStatusFilter }) {
    dlog(
      'findOrderAllocationsForEvent %s, filter: %o',
      eventId,
      enrollmentStatusFilter,
    );
    let query = allocationCollection.where('event', '==', eventId);
    if (
      Array.isArray(enrollmentStatusFilter) &&
      enrollmentStatusFilter?.length > 0
    ) {
      query = query.where('enrollmentStatus', 'in', enrollmentStatusFilter);
    }

    return query.get().then(({ docs }) =>
      docs.map(a => {
        const r = {
          id: a.id,
          ...a.data(),
        };
        return allocationDateForge(r);
      }),
    );
  }

  function findOrderAllocationForOrder({ orderId, orderAllocationId }) {
    dlog(
      'findOrderAllocation called for order: %s, allocation: %s',
      orderId,
      orderAllocationId,
    );
    return allocationCollection
      .doc(orderAllocationId)
      .get()
      .then(docSnap => {
        let result = null;
        if (docSnap.exists) {
          result = {
            id: docSnap.id,
            ...docSnap.data(),
          };
          if (result.order !== orderId) result = null;
        }

        return result;
      });
  }

  function findMeOrderAllocations({ memberId }) {
    dlog(`findMeOrderAlocations called for member %s`, memberId);
    return allocationCollection
      .where('allocatedTo', '==', memberId)
      .get()
      .then(querySnapshot =>
        querySnapshot.docs.map(d => {
          const r = {
            id: d.id,
            ...d.data(),
          };
          return allocationDateForge(r);
        }),
      );
  }

  function findMeOrderAllocationsForEvent({ memberId, eventId }) {
    dlog('findMeOrderAllocationsForEvent called');
    const productTypes = constants.THAT.PRODUCT_TYPE;
    return allocationCollection
      .where('allocatedTo', '==', memberId)
      .where('event', '==', eventId)
      .where('productType', 'in', [
        productTypes.TICKET,
        productTypes.FOOD,
        productTypes.TRAINING,
        productTypes.FAMILY,
      ])
      .get()
      .then(querySnap =>
        querySnap.docs.map(d => {
          const r = {
            id: d.id,
            ...d.data(),
          };
          return allocationDateForge(r);
        }),
      );
  }

  async function markMyAllocationsQuestionsComplete({
    eventId,
    memberId,
    orderReference,
  }) {
    dlog('markMyAllocationsQuestionsComplete called');

    const allocations = await findMeOrderAllocationsForEvent({
      memberId,
      eventId,
    });
    if (allocations.length < 1) return false;
    dlog('updating %d order allocations', allocations.length);
    const batchWrite = dbInstance.batch();
    allocations.forEach(a => {
      const docRef = allocationCollection.doc(a.id);
      batchWrite.update(docRef, {
        hasCompletedQuestions: true,
        questionsReference: orderReference || '',
      });
    });

    return batchWrite.commit().then(() => true);
  }

  function orderAllocationCountWithProduct(productId) {
    dlog('allocationCountWithProduct, %s', productId);
    return allocationCollection
      .where('product', '==', productId)
      .select()
      .get()
      .then(querySnap => querySnap.size);
  }

  return {
    get,
    getBatch,
    getPaged,
    findByEvent,
    getMe,
    getPagedMe,
    create,
    update,
    getOrderAllocation,
    updateOrderAllocation,
    findOrderAllocations,
    findOrderAllocationsForEvent,
    findOrderAllocationForOrder,
    findMeOrderAllocations,
    findMeOrderAllocationsForEvent,
    markMyAllocationsQuestionsComplete,
    orderAllocationCountWithProduct,
  };
};

export default order;
