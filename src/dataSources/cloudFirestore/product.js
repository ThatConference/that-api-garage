import debug from 'debug';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:garage:datasources:firebase:product');
const { dateForge, entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['createdAt', 'lastUpdateAt'];
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
    dlog('getBatch called %d ids', ids.length);
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');
    return Promise.all(ids.map(id => get(id)));
  }

  async function getPaged({ pageSize, cursor }) {
    dlog('get paged called');
    let query = productCollection
      .orderBy('createdAt', 'asc')
      .limit(pageSize || 20);

    if (cursor) {
      const curObject = Buffer.from(cursor, 'base64').toString('utf8');
      const { curCreatedAt } = JSON.parse(curObject);
      if (!curCreatedAt) throw new Error('Invalid cursor provided');
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

  return {
    get,
    getBatch,
    getPaged,
    create,
    update,
  };
};

export default product;
