const ResponseEvent = require('../classes/ResponseEvent');
const Storage = require('../classes/Storage');
const { EVENT_STARTUP } = require('../constants');

const {
  LAMBDA = './testLambda.js',
  HANDLER = 'handler'
} = process.env;

const lambdaHandler = require(LAMBDA)[HANDLER];

setTimeout(() => {
  process.exit(0);
}, 15 * 60 * 1000); // setting to default 15 minutes AWS timeout 15 * 60 * 1000

process.on('message', requestId => {
  if (requestId === EVENT_STARTUP) return;

  const storage = new Storage(requestId);

  Promise.resolve()
    .then(() => storage.getRequest())
    .then(message => new Promise(resolve => {
      lambdaHandler(message, {}, (error, response = {}) => {
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
    .then(() => process.send(requestId));
});
