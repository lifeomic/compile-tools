import Koa from 'koa';
import Router from '@koa/router';
import serverless from 'serverless-http';

const app = new Koa();
const router = new Router();

router.get('/', async (context, next) => {
  context.response.body = {
    service: 'lambda-test',
    parameter: process.env.TEST_PARAMETER,
  };
  await next();
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
app.use(router.routes());
module.exports.handler = serverless(app);
