import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import debug from 'debug';
import * as Sentry from '@sentry/node';
import { security } from '@thatconference/api';
import { isNil } from 'lodash';

// Graph Types and Resolvers
import DataLoader from 'dataloader';
import typeDefs from './typeDefs';
import resolvers from './resolvers';
import directives from './directives';
import productStore from '../dataSources/cloudFirestore/product';
import orderStore from '../dataSources/cloudFirestore/order';
import memberStore from '../dataSources/cloudFirestore/member';
import assetStore from '../dataSources/cloudFirestore/asset';
import BouncerApi from '../dataSources/rest/bouncer';

const dlog = debug('that:api:garage:graphServer');
const jwtClient = security.jwt();

/**
 * will create you a configured instance of an apollo gateway
 * @param {object} userContext - user context that w
 * @return {object} a configured instance of an apollo gateway.
 *
 * @example
 *
 *     createGateway(userContext)
 */
const createServer = ({ dataSources }) => {
  dlog('creating apollo server');
  let schema = {};

  schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

  const directiveTransformers = [
    directives.auth('auth').authDirectiveTransformer,
  ];

  dlog('directiveTransformers: %O', directiveTransformers);
  schema = directiveTransformers.reduce(
    (curSchema, transformer) => transformer(curSchema),
    schema,
  );

  return new ApolloServer({
    schema,
    introspection: JSON.parse(process.env.ENABLE_GRAPH_INTROSPECTION || false),
    csrfPrevention: true,
    cache: 'bounded',
    dataSources: () => {
      dlog('creating dataSources');
      const { firestore } = dataSources;

      const productLoader = new DataLoader(ids =>
        productStore(firestore)
          .getBatch(ids)
          .then(products => {
            if (products.includes(null)) {
              Sentry.withScope(scope => {
                scope.setLevel('error');
                scope.setContext(
                  `Assigned products dont exist in products collection`,
                  { ids },
                  { products },
                );
                Sentry.captureMessage(
                  `Assigned products dont exist in products collection`,
                );
              });
            }
            return ids.map(id => products.find(p => p && p.id === id));
          }),
      );

      const orderLoader = new DataLoader(ids =>
        orderStore(firestore)
          .getBatch(ids)
          .then(orders => {
            if (orders.includes(null)) {
              Sentry.withScope(scope => {
                scope.setLevel('error');
                scope.setContext(
                  `Assigned orders dont exist in orders collection`,
                  { ids },
                  { orders },
                );
                Sentry.captureMessage(
                  `Assigned orders dont exist in orders collection`,
                );
              });
            }
            return ids.map(id => orders.find(o => o && o.id === id));
          }),
      );

      const memberLoader = new DataLoader(ids =>
        memberStore(firestore)
          .getSecureBatch(ids)
          .then(members => {
            if (members.includes(null)) {
              Sentry.withScope(scope => {
                scope.setLevel('error');
                scope.setContext(
                  `Members requested in memberLoader don't exist in member collection`,
                  { ids },
                  { members },
                );
                Sentry.captureMessage(
                  `Members requested in memberLoader don't exist in member collection`,
                );
              });
            }
            return ids.map(id => members.find(m => m && m.id === id));
          }),
      );

      const assetLoader = new DataLoader(ids =>
        assetStore(firestore)
          .getBatch(ids)
          .then(assets => {
            if (assets.includes(null)) {
              Sentry.withScope(scope => {
                scope.setLevel('error');
                scope.setContext(
                  `Assigned Asset's don't exist in assets collection`,
                  { ids },
                  { assets },
                );
                Sentry.captureMessage(
                  `Assigned Asset's don't exist in assets collection`,
                );
              });
            }
            return ids.map(id => assets.find(a => a && a.id === id));
          }),
      );

      return {
        ...dataSources,
        productLoader,
        orderLoader,
        memberLoader,
        assetLoader,
        bouncerApi: new BouncerApi(),
      };
    },
    context: async ({ req, res }) => {
      dlog('building graphql user context');
      let context = {};

      if (!isNil(req.headers.authorization)) {
        dlog('validating token for %o:', req.headers.authorization);
        const authRef = req.headers.authorization?.substring(
          req.headers.authorization.length - 8,
        );
        Sentry.addBreadcrumb({
          category: 'graphql context',
          message: `user has authToken (${authRef})`,
          level: 'info',
        });

        const validatedToken = await jwtClient.verify(
          req.headers.authorization,
        );

        Sentry.configureScope(scope => {
          scope.setUser({
            id: validatedToken.sub,
            permissions: validatedToken.permissions.toString(),
          });
        });

        dlog('validated token: %o', validatedToken);
        context = {
          ...context,
          user: {
            ...validatedToken,
            authToken: req.userContext.authToken,
            site: req.userContext.site,
            correlationId: req.userContext.correlationId,
          },
        };
      }

      return context;
    },
    plugins: [],
    formatError: err => {
      dlog('formatError %O', err);

      Sentry.withScope(scope => {
        scope.setTag('formatError', true);
        scope.setLevel('warning');
        scope.setExtra('originalError', err.originalError);
        scope.setExtra('path', err.path);
        scope.setContext('error object', err);
        Sentry.captureException(err);
      });

      return err;
    },
  });
};

export default createServer;
