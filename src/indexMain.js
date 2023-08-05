/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import http from 'node:http';
import express from 'express';
import { json } from 'body-parser';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import debug from 'debug';
import { Firestore } from '@google-cloud/firestore';
import responseTime from 'response-time';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import { events as apiEvents } from '@thatconference/api';

import apolloGraphServer from './graphql';
import orderAllocationEventEmitter from './events/orderAllocation';
import { version } from './package.json';

const orderAllocationEvents = orderAllocationEventEmitter();

const dlog = debug('that:api:garage:index');
const defaultVersion = `that-api-garage@${version}`;
const firestore = new Firestore();
const graphCdnEmitter = apiEvents.graphCdn;
const graphCdnEvents = graphCdnEmitter(Sentry);
const api = express();
const port = process.env.PORT || 8005;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.THAT_ENVIRONMENT,
  release: process.env.SENTRY_VERSION || defaultVersion,
  debug: process.env.NODE_ENV === 'development',
  normalizeDepth: 6,
});

Sentry.configureScope(scope => {
  scope.setTag('thatApp', 'that-api-garage');
});

const httpServer = http.createServer(api);

const createConfig = () => {
  dlog('createConfig');
  return {
    dataSources: {
      sentry: Sentry,
      firestore,
      events: {
        orderAllocationEvents,
        graphCdnEvents,
      },
    },
    httpServer,
  };
};

const graphServerParts = apolloGraphServer(createConfig());

const sentryMark = async (req, res, next) => {
  Sentry.addBreadcrumb({
    category: 'that-api-garage',
    message: 'garage init',
    level: 'info',
  });
  next();
};

function createUserContext(req, res, next) {
  const correlationId =
    req.headers['that-correlation-id'] &&
    req.headers['that-correlation-id'] !== 'undefined'
      ? req.headers['that-correlation-id']
      : uuidv4();

  Sentry.configureScope(scope => {
    scope.setTag('correlationId', correlationId);
    scope.setContext('headers', {
      headers: req.headers,
    });
  });

  let site;
  if (req.headers['that-site']) {
    site = req.headers['that-site'];
  } else if (req.headers['x-forwarded-for']) {
    // eslint-disable-next-line no-useless-escape
    const rxHost = /^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i;
    const refererHost = req.headers['x-forwarded-for'];
    const host = refererHost.match(rxHost);
    if (host) [, site] = host;
  } else {
    site = 'www.thatconference.com';
  }

  req.userContext = {
    locale: req.headers.locale,
    authToken: req.headers.authorization,
    correlationId,
    site,
  };

  next();
}

function getVersion(req, res) {
  dlog('method %s, defaultVersion %s', req.method, defaultVersion);
  return res.json({ version: defaultVersion });
}

function failure(err, req, res, next) {
  dlog('error %o', err);
  console.log('Error from express:', err.message);
  // Sentry.captureException(err);

  res.set('Content-Type', 'application/json').status(500).json(err);
}

api.use(
  Sentry.Handlers.requestHandler(),
  cors(),
  responseTime(),
  json(),
  sentryMark,
  createUserContext,
);
api.use('/version', getVersion);

const { graphQlServer, createContext } = graphServerParts;

graphQlServer
  .start()
  .then(() => {
    api.use(
      expressMiddleware(graphQlServer, {
        context: async ({ req }) => createContext({ req }),
      }),
    );
  })
  .catch(err => {
    console.log(`graphServer.start() error 💥: ${err.message}`);
    throw err;
  });

api.use(Sentry.Handlers.errorHandler()).use(failure);

api.listen({ port }, () =>
  console.log(`✨Garage 🚘 is running on port 🚢 ${port}`),
);

// graphServer
//   .start()
//   .then(() => {
//     graphServer.applyMiddleware({ app: api, path: '/' });
//     api.listen({ port }, () =>
//       console.log(`✨Garage 🚘 is running 🏃‍♂️ on port 🚢 ${port}`),
//     );
//   })
//   .catch(err => {
//     console.log(`graphServer.start() error 💥: ${err.message}`);
//     throw err;
//   });
