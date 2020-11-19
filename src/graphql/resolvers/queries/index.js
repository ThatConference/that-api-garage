import root from './root';

import { fieldResolvers as notificationsFields } from './notifications';
import { fieldResolvers as productsFields } from './products';

export default {
  ...root,
};

export const fieldResolvers = {
  ...notificationsFields,
  ...productsFields,
};
