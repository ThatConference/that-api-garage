/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import express from 'express';
import debug from 'debug';
import { Firestore } from '@google-cloud/firestore';
import responseTime from 'response-time';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import { events as apiEvents } from '@thatconference/api';

import apolloGraphServer from './graphql';
import orderAllocationEventEmitter from './events/orderAllocation';

const orderAllocationEvents = orderAllocationEventEmitter();

let version;
(async () => {
  let p;
  try {
    p = await import('./package.json');
  } catch {
    p = await import('../package.json');
  }
  version = p.version;
})();

const dlog = debug('that:api:garage:index');
const defaultVersion = `that-api-garage@${version}`;
const firestore = new Firestore();
const api = express();
const graphCdnEmitter = apiEvents.graphCdn;
const graphCdnEvents = graphCdnEmitter(Sentry);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.THAT_ENVIRONMENT,
  release: process.env.SENTRY_VERSION || defaultVersion,
  debug: process.env.NODE_ENV === 'development',
});

Sentry.configureScope(scope => {
  scope.setTag('thatApp', 'that-api-garage');
});

const createConfig = () => ({
  dataSources: {
    sentry: Sentry,
    firestore,
    events: {
      orderAllocationEvents,
      graphCdnEvents,
    },
  },
});

const graphServer = apolloGraphServer(createConfig());

const useSentry = async (req, res, next) => {
  Sentry.addBreadcrumb({
    category: 'that-api-garage',
    message: 'garage init',
    level: Sentry.Severity.Info,
  });
  next();
};

/**
 * http middleware function
 * here we are intercepting the http call and building our own notion of a users context.
 * we then add it to the request so it can later be used by the gateway.
 * If you had something like a token that needs to be passed through to the gateways children this is how you intercept it and setup for later.
 *
 * @param {string} req - http request
 * @param {string} res - http response
 * @param {string} next - next function to execute
 *
 */
function createUserContext(req, res, next) {
  const correlationId =
    req.headers['that-correlation-id'] &&
    req.headers['that-correlation-id'] !== 'undefined'
      ? req.headers['that-correlation-id']
      : uuidv4();

  Sentry.configureScope(scope => {
    scope.setTag('correlationId', correlationId);
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

function failure(err, req, res, next) {
  dlog('error %o', err);
  Sentry.captureException(err);

  res.set('Content-Type', 'application/json').status(500).json(err);
}

api.use(responseTime()).use(useSentry).use(createUserContext).use(failure);

const port = process.env.PORT || 8005;
graphServer
  .start()
  .then(() => {
    graphServer.applyMiddleware({ app: api, path: '/' });
    api.listen({ port }, () =>
      console.log(`✨Garage 🚘 is running 🏃‍♂️ on port 🚢 ${port}`),
    );
  })
  .catch(err => {
    console.log(`graphServer.start() error 💥: ${err.message}`);
    throw err;
  });
