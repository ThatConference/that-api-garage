const checkoutObj = {
  eventId: 'test_eventId',
  products: [
    {
      productId: 'productId_0',
      quantity: 1,
    },
    {
      productId: 'productId_1',
      quantity: 1,
    },
  ],
};
const productsObj = [
  {
    id: 'productId_0',
    name: 'test ticket product',
    eventId: 'test_eventId',
    isEnabled: true,
  },
  {
    id: 'productId_1',
    name: 'test ticket product',
    eventId: 'test_eventId',
    isEnabled: true,
  },
];
const productListObj = ['productId_0', 'productId_1'];
const productUnknown = {
  id: 'UnknownId_0',
  name: 'unknown product 0',
  eventId: 'test_eventId',
  isEnabled: true,
};

describe('validateSaleCheck tests', () => {
  let validateSaleChecks;
  let checkout;
  let products;
  let productList;

  let originalEnv = process.env;

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // puts a copy on process.env

    // Required for @thatconference/api
    process.env.INFLUX_TOKEN = 'TEST_INFLUX_TOKEN_VALUE';
    process.env.INFLUX_ORG_ID = 'TEST_INFLUX_ORG_ID_VALUE';
    process.env.INFLUX_BUCKET_ID = 'INFLUX_BUCKET_ID';
    process.env.INFLUX_HOST = 'INFLUX_HOST';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    const productStore = require('../product').default;
    validateSaleChecks = productStore({ collection: () => {} })
      .validateSaleChecks;
    checkout = { ...checkoutObj };
    products = [...productsObj];
    productList = [...productListObj];
  });

  afterEach(() => {
    validateSaleChecks = null;
    checkout = null;
    products = null;
    productList = null;
  });

  describe('checkout and product counts should match', () => {
    it('Equal counts will pass', () => {
      let result;
      expect(() => {
        result = validateSaleChecks({ checkout, products, productList });
      }).not.toThrow();
      expect(result).toBe(true);
    });
    it('Unequal counts will throw (productList)', () => {
      productList.push('productId_10');
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Checkout validation failed. Not all products found');
    });
    it('Unequal counts will throw (products)', () => {
      products.push({ name: 'some product' });
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Checkout validation failed. Not all products found');
    });
  });
  describe('Only products matching checkout eventId', () => {
    it('Having all matching eventIds succeed', () => {
      let result;
      expect(() => {
        result = validateSaleChecks({ checkout, products, productList });
      }).not.toThrow();
      expect(result).toBe(true);
    });
    it('Mismatch eventId throws', () => {
      const mutate = { ...products[0] };
      mutate.eventId = 'something else';
      products[0] = mutate;
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Cannot purchase items not associated with event');
    });
  });
  describe('only active products allowed', () => {
    it('Having all active products succeed', () => {
      let result;
      expect(() => {
        result = validateSaleChecks({ checkout, products, productList });
      }).not.toThrow();
      expect(result).toBe(true);
    });
    it('having at least one inactive product will throw', () => {
      const mutate = { ...products[0] };
      mutate.isEnabled = false;
      products[0] = mutate;
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Product not enabled for sale');
    });
  });
  describe('Products with dates must be within those dates', () => {
    const epoch = new Date().getTime();
    const diff = 3600000;
    // onSaleFrom: new Date(epoch - 60000),
    // onSaleUntil: new Date(epoch + 60000),
    it('Having no product dates defined succeed', () => {
      let result;
      expect(() => {
        result = validateSaleChecks({ checkout, products, productList });
      }).not.toThrow();
      expect(result).toBe(true);
    });
    it('Having only onSaleFrom before now succeeds', () => {
      const mutate = { ...products[0] };
      mutate.onSaleFrom = new Date(epoch - diff);
      products[0] = mutate;
      let result;
      expect(() => {
        result = validateSaleChecks({ checkout, products, productList });
      }).not.toThrow();
      expect(result).toBe(true);
    });
    it('Having only onSaleFrom after now throws', () => {
      const mutate = { ...products[0] };
      mutate.onSaleFrom = new Date(epoch + diff);
      products[0] = mutate;
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Product not available for sale (date)');
    });
    it('Having only onSale until after now succeeds', () => {
      const mutate = { ...products[0] };
      mutate.onSaleUntil = new Date(epoch + diff);
      products[0] = mutate;
      let result;
      expect(() => {
        result = validateSaleChecks({ checkout, products, productList });
      }).not.toThrow();
      expect(result).toBe(true);
    });
    it('Having only onSaleUntil before now throws', () => {
      const mutate = { ...products[0] };
      mutate.onSaleUntil = new Date(epoch - diff);
      products[0] = mutate;
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Product not available for sale (date)');
    });
    it('Having both product dates in range succeeds', () => {
      const mutate = { ...products[0] };
      mutate.onSaleFrom = new Date(epoch - diff);
      mutate.onSaleUntil = new Date(epoch + diff);
      products[0] = mutate;
      let result;
      expect(() => {
        result = validateSaleChecks({ checkout, products, productList });
      }).not.toThrow();
      expect(result).toBe(true);
    });
    it('Having both dates and onSaleUntil before now, throws (from ok)', () => {
      const mutate = { ...products[0] };
      mutate.onSaleFrom = new Date(epoch - diff);
      mutate.onSaleUntil = new Date(epoch - diff);
      products[0] = mutate;
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Product not available for sale (date)');
    });
    it('Having both dates and onSalefrom after now, throws (until ok)', () => {
      const mutate = { ...products[0] };
      mutate.onSaleFrom = new Date(epoch + diff);
      mutate.onSaleUntil = new Date(epoch + diff);
      products[0] = mutate;
      expect(() => {
        validateSaleChecks({ checkout, products, productList });
      }).toThrow('Product not available for sale (date)');
    });
  });
});
