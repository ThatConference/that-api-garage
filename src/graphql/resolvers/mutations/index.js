import rootMutations from './root';

import { fieldResolvers as productsFields } from './products';
import { fieldResolvers as productFields } from './product';
import { fieldResolvers as productCreateFields } from './productCreate';
import { fieldResolvers as productUpdateFields } from './productUpdate';
import { fieldResolvers as ordersFields } from './orders';
import { fieldResolvers as orderFields } from './order';
import { fieldResolvers as meCheckoutFields } from './meCheckout';

export default {
  ...rootMutations,
};

export const fieldResolvers = {
  ...productsFields,
  ...productFields,
  ...productCreateFields,
  ...productUpdateFields,
  ...ordersFields,
  ...orderFields,
  ...meCheckoutFields,
};
