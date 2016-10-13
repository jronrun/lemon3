'use strict';

var model = schema({
  id: { type: 'integer', required: true },
  title: { type: 'string', allowEmpty: false },
  desc: { type: 'string' },
  type: { type: 'integer', enum: [1, 2, 3, 4, 5, 6, 7, 8], required: true, const: {
      1: 'API',
      2: 'API Capture',
      3: 'API History',
      4: 'Note',
      5: 'Note Capture',
      6: 'Blank Text',
      7: 'APIs || Notes Capture',
      8: 'Merge Capture'
    }
  },
  read_write: { type: 'integer', enum: [1, 2, 3], required: true, const: { 1: 'Readonly', 2: 'User Power', 3: 'Executable'} },
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

share.isAvailable = function(aShare, requestInfo) {
  requestInfo = _.extend({
    usr: {},
    anonymous: true,
    clientIP: ''
  }, requestInfo || {});

  if (!aShare) {
    return answer.fail('Invalid share');
  }

  if (requestInfo.usr.isAdmin) {
    return answer.succ();
  }

  if (aShare.create_by.id == requestInfo.usr.id) {
    return answer.succ();
  }

  //Canceled Sharing
  if (2 == aShare.state) {
    return answer.fail('Canceled sharing');
  }

  //-1 is Unlimited
  if (-1 != aShare.count && ((aShare.used_count + 1) >= aShare.count)) {
    return answer.fail('No more request count. max count ' + aShare.count);
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
  if (requestInfo.anonymous) {
    if (1 != shareTo.anonymous) {
      return answer.fail('Not allowed anonymous user');
    }

    var clientIP = requestInfo.clientIP.substr(requestInfo.clientIP.lastIndexOf(':') + 1);
    if (!inScope(shareTo, clientIP)) {
      return answer.fail(requestInfo.clientIP + ' not in sharing scope');
    }
  }
  //login user
  else {
    if (!requestInfo.usr.email) {
      return answer.fail('Invalid user email');
    }

    //shareTo.anonymous

    if (!inScope(shareTo, requestInfo.usr.email)) {
      return answer.fail(requestInfo.usr.name + '(' + requestInfo.usr.email + ') not in sharing scope');
    }
  }

  return answer.succ();
};

share.shareData = function(aShare, readonly) {
  var qrcLink = '/share/' + crypto.compress(aShare._id.toString()), link = qrcLink;
  if (aShare.title && aShare.title.length > 0) {
    link = link + '/' + aShare.title.replace(/\s/g, '-');
  }

  return {
    original: aShare.original,
    readonly: readonly || false,
    edit: aShare._id.toString(),
    qrcLink: qrcLink,
    link: link
  };
};

share.addUseCount = function(aShare, resultCall, requestInfo) {
  if (requestInfo.usr.isAdmin || aShare.create_by.id == requestInfo.usr.id) {
    return resultCall(answer.succ());
  }

  share.updateById(aShare._id.toString(), {
    $inc: {
      used_count: 1
    }
  }, function (err) {
    if (err) {
      return resultCall(answer.fail(err.message));
    }

    resultCall(answer.succ());
  });
};

share.fastShare = function(params, resultCall, requestInfo) {
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
    create_time: new Date(),

    check: 1    //check exists, 1 check 0 uncheck
  }, params || {});

  if (!aShare.type || !aShare.content) {
    return resultCall(answer.fail('invalid type or content'));
  }

  aShare.type = parseInt(aShare.type);
  aShare.title = _.trim(aShare.title);
  aShare.content = crypto.compress(aShare.content);

  async.waterfall([
    function(callback) {
      if (1 == aShare.check && ([1, 3, 4].indexOf(aShare.type) != -1)) {
        share.find({
          type: aShare.type,
          content: aShare.content,
          'create_by.id': aShare.create_by.id
        }).sort({id: -1}).limit(1).next(function(err, existShare) {
          if (err) {
            return resultCall(answer.fail(err.message));
          }

          if (existShare) {
            existShare._id = existShare._id.toString();
            existShare.original = {
              title: existShare.title,
              type: existShare.type,
              content: crypto.decompress(existShare.content)
            };
            resultCall(answer.succ(existShare));
          } else {
            callback(null, aShare);
          }
        });
      } else {
        callback(null, aShare);
      }
    },

    function(target, callback) {
      share.nextId(function (id) {
        target.id = id;

        delete target.check;
        var check = share.validate(target);
        if (!check.valid) {
          return resultCall(answer.fail(check.msg));
        }

        share.insertOne(target, function(err, result) {
          if (err) {
            return resultCall(answer.fail(err.message));
          }

          if (1 != result.insertedCount && !share.isObjectID(result.insertedId)) {
            return resultCall(answer.fail('create fail'));
          }

          target._id = result.insertedId.toString();
          target.original = false;
          callback(null, answer.succ(target));
        });
      });
    }
  ], function(err, result) {
    resultCall(result);
  });

};

module.exports = share;

