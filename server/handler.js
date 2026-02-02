const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app');

let serverlessExpressInstance;

async function setup(event, context) {
  serverlessExpressInstance = serverlessExpress({
    app,
    binarySettings: {
      isBinary: ({ headers }) => {
        const contentType = headers['content-type'] || '';
        return contentType.includes('multipart/form-data');
      }
    }
  });
  return serverlessExpressInstance(event, context);
}

exports.handler = async (event, context) => {
  // Importante para Lambda + MongoDB
  context.callbackWaitsForEmptyEventLoop = false;

  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  return setup(event, context);
};
