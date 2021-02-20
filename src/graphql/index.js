import { ApolloServer, SchemaDirectiveVisitor } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import debug from 'debug';
import * as Sentry from '@sentry/node';
import { security, graph } from '@thatconference/api';
import { isNil } from 'lodash';

// Graph Types and Resolvers
import DataLoader from 'dataloader';
import typeDefs from './typeDefs';
import resolvers from './resolvers';
import directives from './directives';
import productStore from '../dataSources/cloudFirestore/product';
import orderStore from '../dataSources/cloudFirestore/order';
import memberStore from '../dataSources/cloudFirestore/member';
import BouncerApi from '../dataSources/rest/bouncer';

const dlog = debug('that:api:garage:graphServer');
const jwtClient = security.jwt();
const { lifecycle } = graph.events;

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
  dlog('creating graph server');

  const schema = buildFederatedSchema([{ typeDefs, resolvers }]);
  SchemaDirectiveVisitor.visitSchemaDirectives(schema, directives);

  return new ApolloServer({
    schema,
    introspection: JSON.parse(process.env.ENABLE_GRAPH_INTROSPECTION || false),
    playground: JSON.parse(process.env.ENABLE_GRAPH_PLAYGROUND)
      ? { endpoint: '/' }
      : false,

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
          .getBatch(ids)
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

      return {
        ...dataSources,
        productLoader,
        orderLoader,
        memberLoader,
        bouncerApi: new BouncerApi(),
      };
    },

    context: async ({ req, res }) => {
      dlog('building graphql user context');
      let context = {};

      if (!isNil(req.headers.authorization)) {
        dlog('validating token for %o:', req.headers.authorization);
        Sentry.addBreadcrumb({
          category: 'graphql context',
          message: 'user has authToken',
          level: Sentry.Severity.Info,
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

    plugins: [
      {
        requestDidStart() {
          return {
            executionDidStart(requestContext) {
              lifecycle.emit('executionDidStart', {
                service: 'that:api:garage',
                requestContext,
              });
            },
          };
        },
      },
    ],

    formatError: err => {
      dlog('formatError %O', err);

      Sentry.withScope(scope => {
        scope.setTag('formatError', true);
        scope.setLevel('warning');
        scope.setExtra('originalError', err.originalError);
        scope.setExtra('path', err.path);
        Sentry.captureException(err);
      });

      return err;
    },
  });
};

export default createServer;
