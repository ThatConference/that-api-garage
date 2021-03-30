# THAT Garage Api

Our collection of entities which don't belong in the other api services.

[![Actions Status](https://github.com/ThatConference/that-api-garage/workflows/Push%20Master%20CI%20for%20Cloud%20Run/badge.svg)](https://github.com/ThatConference/that-api-garage/workflows/actions)

## Dependencies

- Node `12+`

## Setup and Configuration

- Install node.js in use: `nodenv install $(cat .node_version)`
- Load dependencies: `npm i`

setup notes:

- we use nodenv to manage node.js - [https://github.com/nodenv/nodenv](https://github.com/nodenv/nodenv)

## .env

You will need to add a `.env` file to your source. See the .env.sample included in the source base for the keys.

## Running

The main development starting point is `npm run start:watch`

- `npm run start:watch` to run with a watcher.
- `npm run start` to just run`.

## Endpoints

- Endpoint: [http://localhost:8005/](http://localhost:8005/) or [http://localhost:8005/graphql](http://localhost:8005/graphql)
