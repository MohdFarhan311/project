const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../server');
const pilotRouter = require('../routes/pilot');
const customerRouter = require('../routes/customers');

function routeHandler(router, method, routePath, handlerIndex = 0) {
  const stack = router.stack || router._router.stack;
  const route = stack.find(layer => layer.route?.path === routePath && layer.route.methods[method]);
  assert.ok(route, `${method.toUpperCase()} ${routePath} should be registered`);
  return route.route.stack[handlerIndex].handle;
}

function responseDouble() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('health endpoint reports unavailable database state', () => {
  const handler = routeHandler(app, 'get', '/api/health');
  const response = responseDouble();
  handler({}, response);

  assert.equal(response.statusCode, mongoose.connection.readyState === 1 ? 200 : 503);
  assert.deepEqual(response.body, mongoose.connection.readyState === 1
    ? { status: 'ok', database: 'connected' }
    : { status: 'degraded', database: 'unavailable' });
});

test('pilot enquiry validates required fields before database access', async () => {
  const handler = routeHandler(pilotRouter, 'post', '/', 0);
  const response = responseDouble();
  await handler({ body: { businessName: 'Shop', ownerName: 'Owner' } }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: 'email is required' });
});

test('customer authentication middleware rejects requests without a token', async () => {
  const auth = require('../middleware/auth').auth;
  const response = responseDouble();
  await auth({ header: () => undefined }, response, () => assert.fail('next should not run'));

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: 'No token, authorization denied' });
});

test('demo payment route rejects malformed transaction IDs before model access', async () => {
  const handler = routeHandler(customerRouter, 'post', '/pay/:transactionId', 1);
  const response = responseDouble();
  await handler({ user: { role: 'customer' }, params: { transactionId: 'invalid' }, body: {} }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: 'Invalid plan ID' });
});
