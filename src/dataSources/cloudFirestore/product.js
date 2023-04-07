import debug from 'debug';
import { utility } from '@thatconference/api';
import * as Sentry from '@sentry/node';
import { ValidationError } from '../../lib/errors';

const dlog = debug('that:api:garage:datasources:firebase:product');
const { dateForge, entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['createdAt', 'lastUpdateAt', 'onSaleFrom', 'onSaleUntil'];
const productDateForge = entityDateForge({ fields: forgeFields });

const collectionName = 'products';

const scrubProduct = ({ product, isNew, userId }) => {
  dlog('scrubProduct called');
  const scrubbedProduct = product;
  const thedate = new Date();
  if (isNew) {
    scrubbedProduct.createdAt = thedate;
    scrubbedProduct.createdBy = userId;
  }
  scrubbedProduct.lastUpdatedAt = thedate;
  scrubbedProduct.lastUpdatedBy = userId;

  return scrubbedProduct;
};

function isValidDate(d) {
  // eslint-disable-next-line no-restricted-globals
  return d instanceof Date && !isNaN(d);
}

const product = dbInstance => {
  dlog('instance created');

  const productCollection = dbInstance.collection(collectionName);

  function get(id) {
    dlog('get called %s', id);
    return productCollection
      .doc(id)
      .get()
      .then(doc => {
        let result = null;
        if (doc.exists) {
          result = {
            id: doc.id,
            ...doc.data(),
          };
          result = productDateForge(result);
        }
        return result;
      });
  }

  function getBatch(ids) {
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');
    dlog('product getBatch called %d ids', ids.length);
    const docRefs = ids.map(id => productCollection.doc(id));
    return dbInstance.getAll(...docRefs).then(docs =>
      docs.map(doc => {
        let result = null;
        if (doc.exists) {
          result = {
            id: doc.id,
            ...doc.data(),
          };
          result = productDateForge(result);
        }
        return result;
      }),
    );
  }

  async function getPaged({ pageSize, cursor }) {
    dlog('get paged called');
    let query = productCollection
      .orderBy('createdAt', 'asc')
      .limit(pageSize || 20);

    if (cursor) {
      const curObject = Buffer.from(cursor, 'base64').toString('utf8');
      dlog('🚯 curObject" %O', curObject);
      const { curCreatedAt } = JSON.parse(curObject);
      if (!curCreatedAt) throw new Error('Invalid cursor provided');

      const startAfterdate = new Date(curCreatedAt);
      if (!isValidDate(startAfterdate)) {
        Sentry.setTags({
          rawCursor: cursor,
          cursor: curObject,
        });
        throw new Error('Invalid cursor provided');
      }

      query = query.startAfter(new Date(curCreatedAt));
    }
    const { size, docs } = await query.get();
    dlog('found %d records', size);

    const products = docs.map(doc => {
      const r = {
        id: doc.id,
        ...doc.data(),
      };
      return productDateForge(r);
    });

    const lastdoc = products[products.length - 1];
    let newCursor = '';
    if (lastdoc) {
      const cpieces = JSON.stringify({
        curCreatedAt: dateForge(lastdoc.createdAt),
      });
      newCursor = Buffer.from(cpieces, 'utf8').toString('base64');
    }

    return {
      products,
      cursor: newCursor,
      count: products.length,
    };
  }

  async function create({ newProduct, userId }) {
    dlog('create called');
    const scrubbedProduct = scrubProduct({
      product: newProduct,
      isNew: true,
      userId,
    });
    const newDoc = await productCollection.add(scrubbedProduct);

    return get(newDoc.id);
  }

  async function update({ productId, newProduct, userId }) {
    dlog('update called');
    const scrubbedProduct = scrubProduct({ product: newProduct, userId });
    const docRef = productCollection.doc(productId);
    await docRef.update(scrubbedProduct);

    return get(docRef.id);
  }

  // broken out to allow testing of logic after local db call
  // which is difficult to mock within module
  function validateSaleChecks({ checkout, products, productList }) {
    dlog('performing checks on checkout and products');

    const { eventId } = checkout;

    if (products.length !== productList.length) {
      dlog(
        '%o <--> %o',
        productList,
        products.map(p => (p ? p.id : null)),
      );
      throw new ValidationError(
        'Checkout validation failed. Not all products found',
      );
    }
    // validations
    for (let i = 0; i < products.length; i += 1) {
      const item = products[i];
      if (item.eventId !== eventId) {
        dlog('product eventId mismatch %o, id: %s', item, eventId);
        Sentry.configureScope(scope => {
          scope.setTags({
            productId: item.id,
            eventId,
          });
          scope.setContext('product', { product: item });
        });
        throw new ValidationError(
          'Cannot purchase items not associated with event',
        );
      }
      if (!item.isEnabled) {
        dlog('product not enabled for sale %o', item);
        Sentry.configureScope(scope => {
          scope.setTag('productId', item.id);
          scope.setContext('product', { product: item });
        });
        throw new ValidationError('Product not enabled for sale');
      }
      if (!item.processor) {
        dlog(`product doesn't have processor. id: %o`, item);
        Sentry.configureScope(scope => {
          scope.setTag('productId', item.id);
          scope.setContext('product', { product: item });
        });
        throw new ValidationError(
          'Product has no processor assigned. Cannot checkout.',
        );
      } else if (item?.processor?.processor !== 'STRIPE') {
        dlog(`Product isn't using stripe processor. id: %o`, item);
        Sentry.configureScope(scope => {
          scope.setTag('productId', item.id);
          scope.setContext('product', { product: item });
        });
        throw new ValidationError(
          `Product isn't using stripe processor. Cannot checkout.`,
        );
      } else if (!item?.processor?.itemRefId?.startsWith('price_')) {
        dlog(`Product with missing or malformed itemRefId. id: %o`, item);
        Sentry.configureScope(scope => {
          scope.setTag('productId', item.id);
          scope.setContext('product', { product: item });
        });
        throw new ValidationError(
          `processor price missing or malformed. Cannot checkout.`,
        );
      }
      const today = new Date();
      if (item.onSaleFrom && new Date(item.onSaleFrom) > today) {
        dlog(
          'product not in sale dates %s -> %s',
          item.onSaleFrom,
          item.onSaleUntil,
        );
        Sentry.configureScope(scope => {
          scope.setTag('productId', item.id);
          scope.setContext('product', { product: item });
        });
        throw new ValidationError('Product not available for sale (date)');
      }
      if (item.onSaleUntil && new Date(item.onSaleUntil) < today) {
        dlog(
          'product not in sale dates %s -> %s',
          item.onSaleFrom,
          item.onSaleUntil,
        );
        Sentry.configureScope(scope => {
          scope.setTag('productId', item.id);
          scope.setContext('product', { product: item });
        });
        throw new ValidationError('Product not available for sale (date)');
      }
      if (item.isClaimable === true) {
        dlog('Product is claimable and cannot be sold through stripe checkout');
        Sentry.configureScope(scope => {
          scope.setTag('productId', item.id);
          scope.setContext('product', { product: item });
        });
        throw new ValidationError(
          'Claimable products cannot be processed through stripe checkout',
        );
      }
    }
    return true;
  }

  // validates products can be sold with referenced eventId
  // before returning product list of checkout items
  async function validateSale(checkout) {
    dlog('validate called');
    const productList = checkout.products.map(p => p.productId);
    const products = await getBatch(productList);

    const result = validateSaleChecks({
      checkout,
      products,
      productList,
    });

    if (result) return products;
    return null;
  }

  function remove(productId) {
    dlog('delete called on product %s', productId);
    return productCollection.doc(productId).delete();
  }

  function findAllByEventId(eventId) {
    dlog('findAllByEvent called for event %s', eventId);
    return productCollection
      .where('eventId', '==', eventId)
      .get()
      .then(({ docs }) =>
        docs.map(p => {
          const r = {
            id: p.id,
            ...p.data(),
          };
          return productDateForge(r);
        }),
      );
  }

  return {
    get,
    getBatch,
    getPaged,
    create,
    update,
    validateSaleChecks,
    validateSale,
    remove,
    findAllByEventId,
  };
};

export default product;
