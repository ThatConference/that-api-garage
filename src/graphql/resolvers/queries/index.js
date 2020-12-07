import root from './root';

import { fieldResolvers as productsFields } from './products';
import { fieldResolvers as productFields } from './product';
import { fieldResolvers as ordersFields } from './orders';
import { fieldResolvers as orderFields } from './order';
import { fieldResolvers as meOrderFields } from './meOrder';

export default {
  ...root,
};

export const fieldResolvers = {
  ...productsFields,
  ...productFields,
  ...ordersFields,
  ...orderFields,
  ...meOrderFields,
};
