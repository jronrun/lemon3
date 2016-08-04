'use strict';

var log = log_from('share');

var model = schema({
  id: { type: 'integer', required: true },
  title: { type: 'string', allowEmpty: false },
  desc: { type: 'string' },
  type: { type: 'integer', enum: [1, 2, 3, 4, 5, 6], required: true, const: {
      1: 'API',
      2: 'API Capture',
      3: 'API History',
      4: 'Note',
      5: 'Note Capture',
      6: 'Blank Text',
      7: 'APIs Capture'
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
  share_to: {
    type: 'object',
    properties: {
      anonymous: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Anonymous', 2: 'Login User'} },
      scope: { type: 'integer', enum: [1, 2, 3, 4], required: true, const: SCOPE_DEFINE },
      //IP if Anonymous, User email if Login User
      define: { type: 'array', uniqueItems: true }
    }
  },
  //Reference ID if type is 1, 3, 4
  content: { type: 'string', allowEmpty: false },
  state: { type: 'integer', enum: [1, 2], required: true, const: { 1: 'Sharing', 2: 'Canceled'} },
  create_by: {
    type: 'object',
    properties: {
      id: { type: 'string', allowEmpty: false },
      name: { type: 'string', required: true },
      ip: { type: 'string', allowEmpty: false }
    }
  },
  last_modify_time: { type: 'date', required: true },
  create_time: { type: 'date', required: true }
});

var share = model_bind('share', model);

share.isAvailable = function(aShare, options) {
  options = _.extend({
    usr: {},
    anonymous: true,
    clientIP: ''
  }, options || {});

  if (!aShare) {
    return answer.fail('Invalid share');
  }

  if (options.usr.isAdmin) {
    return answer.succ();
  }

  //Canceled Sharing
  if (2 == aShare.state) {
    return answer.fail('Canceled sharing');
  }

  //-1 is Unlimited
  if (-1 != aShare.count && ((aShare.used_count + 1) >= aShare.count)) {
    return answer.fail('No more request count');
  }

  var now = new Date().getTime();
  if (aShare.start_time && aShare.start_time.getTime() > now) {
    return answer.fail('Not in share date region, share begin: ' + datefmt(aShare.start_time));
  }

  if (aShare.end_time && aShare.end_time.getTime() < now) {
    return answer.fail('Not in share date region, share end: ' + datefmt(aShare.end_time));
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
    if (!options.usr.email) {
      return answer.fail('Invalid user');
    }

    //shareTo.anonymous

    if (!inScope(shareTo, options.usr.email)) {
      return answer.fail(options.usr.name + '(' + options.usr.email + ') not in sharing scope');
    }
  }

  return answer.succ();
};

share.fastShare = function(params, callback, requestInfo) {
  var now = moment().hours(0).minutes(0);
  var startTime = now.toDate(), endTime = now.clone().add(7, 'd').toDate();

  var aShare = _.extend({
    type: null,
    content: null,

    title: '',
    desc: '',
    read_write: 1,
    count: 30,

    used_count: 0,
    start_time: startTime,
    end_time: endTime,
    share_to: {
      anonymous: 1,
      scope: 1,
      define: []
    },
    state: 1,
    create_by: {
      id: requestInfo.usr.id,
      name: requestInfo.usr.name,
      ip: requestInfo.clientIP
    },
    last_modify_time: new Date(),
    create_time: new Date()
  }, params || {});

  aShare.title = _.trim(aShare.title);
  aShare.content = crypto.compress(aShare.content);

  share.nextId(function (id) {
    aShare.id = id;

    var check = share.validate(aShare);
    if (!check.valid) {
      return callback(answer.fail(check.msg));
    }

    share.insertOne(aShare, function(err, result) {
      if (err) {
        return callback(answer.fail(err.message));
      }

      if (1 != result.insertedCount) {
        return callback(answer.fail('create fail'));
      }

      aShare._id = result.insertedId.toString();
      callback(answer.succ(aShare));
    });
  });

};

module.exports = share;

