'use strict';

var items = require('../helpers/items');

var model = schema({
  id: { type: 'integer', required: true },
  title: { type: 'string', required: true, allowEmpty: false },
  summary: { type: 'string', allowEmpty: false },
  content: { type: 'string', allowEmpty: false },
  note: { type: 'string' },
  tags: { type: 'array', uniqueItems: true },
  create_by: {
    type: 'object',
    required: true,
    properties: {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true }
    }
  },
  last_modify_time: { type: 'date', required: true },
  create_time: { type: 'date', required: true }
});

var note = model_bind('note', model);

/**
 *
 * @param noteId
 * @param aNote
 * @param resultCall
 * @param tagOpt    1 set, 2 add, 3 remove
 */
note.updateBy = function (noteId, aNote, resultCall, tagOpt) {
  tagOpt = tagOpt || 1; async.waterfall([
    function(callback) {
      note.findById(noteId, function (err, result) {
        if (err) {
          return resultCall(answer.fail(err.message));
        }

        if (!result) {
          return resultCall(answer.fail('item not exists.'));
        }

        var theTags = item.arrays(result.tags, aNote.tags || [], tagOpt);
        var check = note.validate(_.extend(result, aNote));
        if (!check.valid) {
          return resultCall(answer.fail(check.msg));
        }

        if (_.has(aNote, 'tags')) {
          aNote.tags = theTags;
        }
        aNote.last_modify_time = new Date();
        aNote.content = crypto.compress(aNote.content);
        callback(null, aNote, result);
      });
    },
    function (target, itemObj, callback) {
      note.updateById(noteId, {$set: target}, function (err) {
        if (err) {
          return resultCall(answer.fail(err.message));
        }

        callback(null, itemObj);
      });
    }
  ], function (err, result) {
    return resultCall(answer.succ());
  });

};

note.fastNote = function (params, resultCall, requestInfo) {
  var aNote = _.extend({
    title: null,
    summary: null,
    content: null,

    tags: [],
    create_by: {
      id: requestInfo.usr.id,
      name: requestInfo.usr.name
    },
    last_modify_time: new Date(),
    create_time: new Date()
  }, params || {});

  if (!aNote.title || !aNote.summary || !aNote.content) {
    return resultCall(answer.fail('invalid note'));
  }

  aNote.content = crypto.compress(aNote.content);

  async.waterfall([
    function(callback) {
      callback(null, aNote);
    },

    function(target, callback) {
      note.nextId(function (id) {
        target.id = id;

        delete target.check;
        var check = note.validate(target);
        if (!check.valid) {
          return resultCall(answer.fail(check.msg));
        }

        note.insertOne(target, function(err, result) {
          if (err) {
            return resultCall(answer.fail(err.message));
          }

          if (1 != result.insertedCount) {
            return resultCall(answer.fail('create fail'));
          }

          target._id = result.insertedId.toString();
          callback(null, answer.succ(target));
        });
      });
    }
  ], function(err, result) {
    resultCall(result);
  });
};

note.queryByKey = function (options, resultCall, requestInfo) {
  options = _.extend({
    key: '',
    keyTag: '',   //eg: 1,2,3
    pn: 1,
    ps: false
  }, options || {});
  var query = {};

  if (options.key && options.key.length > 0) {
    var likeKey = new RegExp(options.key, 'i');
    _.extend(query, {
      $or: [
        {title: likeKey},
        {summary: likeKey},
        {note: likeKey}
      ]
    });
  }

  if (options.keyTag && options.keyTag.length > 0) {
    var keyTags = [], tmp = options.keyTag.split(',');
    _.each(tmp, function (v) {
      try {
        keyTags.push(parseInt(v));
      } catch (e) {/**/}
    });
    _.extend(query, { tags: {$all: keyTags}});
  }

  _.extend(query, {
    'create_by.id': requestInfo.usr.id
  });

  var qryOpts = {
    fields: {
      content: 0
    },
    sorts: {
      id: -1
    }
  };

  note.page(query, options.pn, false, options.ps, qryOpts).then(function (result) {
    resultCall(answer.succ({
      items: result.items,
      hasNext: result.page.hasNext
    }));
  });
};

module.exports = note;

