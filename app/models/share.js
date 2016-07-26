'use strict';

var log = log_from('share');

var model = schema({
  id: { type: 'integer', required: true },
  type: { type: 'integer', enum: [1, 2], required: true, const: {
      1: 'API',
      2: 'API Capture',
      3: 'API History',
      4: 'Note',
      5: 'Blank Text'
    }
  },
  share_to: {
    type: 'object',
    properties: {
      anonymous: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Anonymous', 2: 'Login User'} },
      scope: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: SCOPE_DEFINE },
      //IP if Anonymous, User ID if Login User
      define: { type: 'array', uniqueItems: true }
    }
  },
  read_write: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Readonly', 2: 'Read Write'} },
  //Allow count, Unlimited if count is -1
  //Opened count if readonly
  //Requested count if read write
  count: { type: 'integer', required: true },
  used_count: { type: 'integer', required: true },
  start_time: { type: 'date', required: true },
  //share expire time
  end_time: { type: 'date', required: true },
  //Reference ID if type is 1, 3, 4
  content: { type: 'string', allowEmpty: false },
  user: {
    type: 'object',
    properties: {
      id: { type: 'string', allowEmpty: false },
      name: { type: 'string', required: true },
      ip: { type: 'string', allowEmpty: false }
    }
  },
  state: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Sharing', 2: 'Canceled'} },
  create_time: { type: 'date', required: true }
});

var share = model_bind('share', model);

share.isAvailable = function(aShare, options) {
  options = _.extend({
    usr: {},
    anonymous: true,
    clientIP: ''
  }, options || {});

  if (options.usr.isAdmin) {
    return answer.succ();
  }

  if (!aShare) {
    return answer.fail('Invalid share');
  }

  //Canceled Sharing
  if (2 == aShare.state) {
    return answer.fail('Canceled sharing');
  }

  //-1 is Unlimited
  if (-1 != aShare.count && ((aShare.used_count + 1) >= aShare.count)) {
    return answer.fail('No more open count');
  }

  var now = new Date().getTime();
  if (aShare.start_time.getTime() > now || aShare.end_time.getTime() < now) {
    return answer.fail('Not in share date region');
  }

  var shareTo = aShare.share_to;
  //anonymous
  if (options.anonymous) {
    if (1 != shareTo.anonymous) {
      return answer.fail('Not allowed anonymous user');
    }

    if (!inScope(shareTo, options.clientIP)) {
      return answer.fail(options.clientIP + ' not in sharing scope');
    }
  }
  //login user
  else {
    if (!options.usr.id) {
      return answer.fail('Invalid user');
    }

    //shareTo.anonymous

    if (!inScope(shareTo, options.usr.id)) {
      return answer.fail(options.usr.name + ' not in sharing scope');
    }
  }

  return answer.succ();
};

module.exports = share;

