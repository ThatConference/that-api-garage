import checkoutValidation from '../checkoutValidation';

const checkout = {
  eventId: 'ThisIstheTHATeventId',
  products: null,
};

const product = {
  productId: 'productIdvalueBA',
  quantity: 1,
  isBulkPurchase: false,
};

describe('Test checkout validation with yup', () => {
  let checkoutA;
  let productA;
  beforeEach(() => {
    checkoutA = {
      ...checkout,
    };
    productA = {
      ...product,
    };
  });

  afterEach(() => {
    checkoutA = null;
    productA = null;
  });

  it('will validate non bulk qty 1', () => {
    checkoutA.products = [productA];
    expect.assertions(1);
    return checkoutValidation({ checkout: checkoutA }).then(result => {
      expect(result).toBe(true);
    });
  });

  it('checkout products must be an array', () => {
    checkoutA.products = productA;
    expect.assertions(1);
    return expect(
      checkoutValidation({ checkout: checkoutA }),
    ).rejects.toThrow();
  });

  it('will throw with non build qty > 1', () => {
    checkoutA.products = [
      {
        ...productA,
        quantity: 3,
      },
    ];
    expect.assertions(1);
    return expect(
      checkoutValidation({ checkout: checkoutA }),
    ).rejects.toThrow();
  });

  it('will validate with bulk true and qty > 0', () => {
    checkoutA.products = [
      {
        ...productA,
        isBulkPurchase: true,
      },
    ];
    expect.assertions(1);
    return checkoutValidation({ checkout: checkoutA }).then(result => {
      expect(result).toBe(true);
    });
  });

  it('will validate with bulk true and qty > 0', () => {
    checkoutA.products = [
      {
        ...productA,
        isBulkPurchase: true,
        quantity: 20,
      },
    ];
    expect.assertions(1);
    return checkoutValidation({ checkout: checkoutA }).then(result => {
      expect(result).toBe(true);
    });
  });

  it('will validate with bulk true and qty > 0 and an individual', () => {
    checkoutA.products = [
      {
        ...productA,
        isBulkPurchase: true,
        quantity: 20,
      },
    ];
    checkoutA.products.push({
      ...productA,
    });
    expect.assertions(1);
    return checkoutValidation({ checkout: checkoutA }).then(result => {
      expect(result).toBe(true);
    });
  });

  it('will validate with 2 individual orders', () => {
    checkoutA.products = [
      {
        ...productA,
      },
    ];
    checkoutA.products.push({
      ...productA,
      productId: 'someOtherPoductIdvalue',
    });
    expect.assertions(1);
    return checkoutValidation({ checkout: checkoutA }).then(result => {
      expect(result).toBe(true);
    });
  });

  it('will throw with 1 of 3 line items invalid', () => {
    checkoutA.products = [
      {
        ...productA,
      },
    ];
    checkoutA.products.push({
      ...productA,
      productId: 'someOtherPoductIdvalue',
    });
    checkoutA.products.push({
      ...productA,
      productId: 'someOtherPoductIdvalueB',
      quantity: 6,
    });
    expect.assertions(1);
    return expect(
      checkoutValidation({ checkout: checkoutA }),
    ).rejects.toThrow();
  });

  it('will throw with > 6 line items on the checkout', () => {
    checkoutA.products = [
      {
        ...productA,
      },
    ];
    for (let i = 0; i < 6; i += 1) {
      checkoutA.products.push({
        ...productA,
        productId: `someOtherPoductIdvalue_${i}`,
      });
    }
    expect.assertions(1);
    return expect(
      checkoutValidation({ checkout: checkoutA }),
    ).rejects.toThrow();
  });
});
