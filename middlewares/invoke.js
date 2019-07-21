const ResponseEvent = require('../classes/ResponseEvent');
const {
  EVENT_STARTED,
  EVENT_REQUEST,
  EVENT_RESPONSE,
} = require('../constants');

const {
  LAMBDA = './testLambda.js',
  HANDLER = 'handler',
  STORAGE = '',
} = process.env;

const lambdaHandler = require(LAMBDA)[HANDLER];
const Storage = require(STORAGE);

setTimeout(() => {
  process.exit(0);
}, 15 * 60 * 1000); // setting to default 15 minutes AWS timeout 15 * 60 * 1000

process.on('message', event => {
  if (event.type === EVENT_REQUEST) {
    const storage = new Storage(event.id, process);

    Promise.resolve()
      .then(() => storage.getRequest())
      .then(requestEvent => new Promise(resolve => {
        lambdaHandler(requestEvent, {}, (error, response = {}) => {
          const responseEvent = new ResponseEvent;

          if (error) {
            responseEvent.statusCode = 500;
            responseEvent.body = error.body || error + '';
          } else {
            Object.assign(responseEvent, response);
          }

          resolve(responseEvent);
        });
      }))
      .then(responseEvent => storage.setResponse(responseEvent))
      .then(() => process.send({ type: EVENT_RESPONSE, id: event.id }));
  }
});

process.send({ type: EVENT_STARTED });
