'use strict';

var logger = require('apiconnect-cli-logger/logger.js')
  .child({loc: 'apiconnect-microgateway:policies:rate-limiting:helper'});

exports.handleResponse =
  function(limit, remaining, reset, reject, context, flow) {
    if (remaining < 0 && reject) {
      let resMsg = setupHeaders();
      var err = new Error('Rate limit exceeded');
      err.statusCode = 429;
      err.name = 'RateLimitExceeded';
      context.error = err;
      logger.debug('Rate limit exceeded: %j', err);
      return flow.fail(err);
    }

    context.subscribe('post-flow', function(event, done) {
      setupHeaders();
      done();
    });

    return flow.proceed();

    function setupHeaders() {
      let resMsg = context.get('message');
      if (!resMsg) {
        resMsg = {};
        context.set('message', resMsg);
      }
      var resMsgHeaders = resMsg && resMsg.headers;
      if (!resMsgHeaders) {
        resMsgHeaders = {};
        resMsg.headers = resMsgHeaders;
      }
      logger.debug('Limit: %d Remaining: %d Reset: %d', limit, remaining, reset);
      resMsgHeaders['X-RateLimit-Limit'] = limit;
      resMsgHeaders['X-RateLimit-Remaining'] = remaining;
      resMsgHeaders['X-RateLimit-Reset'] = reset;
      return resMsg;
    }
  };