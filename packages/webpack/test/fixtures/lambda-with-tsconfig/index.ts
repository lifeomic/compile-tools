/* eslint-disable @typescript-eslint/no-require-imports */
const Koa = require('koa');
const Router = require('@koa/router');
const serverless = require('serverless-http');

const app = new Koa();
const router = new Router();

router.get('/', async (context: any, next: any) => {
  context.response.body = {
    service: 'lambda-test',
    parameter: process.env.TEST_PARAMETER,
  };
  await next();
});

app.use(router.routes());
export const handler = serverless(app);
