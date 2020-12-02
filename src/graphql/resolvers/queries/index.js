import root from './root';

import { fieldResolvers as productsFields } from './products';
import { fieldResolvers as productFields } from './product';

export default {
  ...root,
};

export const fieldResolvers = {
  ...productsFields,
  ...productFields,
};
