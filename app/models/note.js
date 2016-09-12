'use strict';

var items = require('../helpers/items');

var model = schema({
  id: { type: 'integer', required: true },
  title: { type: 'string', required: true, allowEmpty: false },
  summary: { type: 'string', allowEmpty: false },
  content: { type: 'string', allowEmpty: false },
  note: { type: 'string' },
  tags: { type: 'array', uniqueItems: true },
  state: { type: 'integer', enum: [1, 9], required: true, const: { 1: 'Using', 9: 'Deleted'} },
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

note.make = function (item, needContent) {
  var aNote = {
    _id: item._id,
    title: item.title,
    summary: item.summary,
    note: item.note,
    tags: item.tags
  };

  if (needContent) {
    aNote.content = crypto.decompress(item.content);
  }
  return aNote;
};

note.getNoteById = function (noteId, resultCall, requestInfo) {
  var qry = note.idQueryParam(noteId);
  if (!requestInfo.usr.isAdmin) {
    _.extend(qry, {
      state: 1,
      'create_by.id': requestInfo.usr.id
    });
  }

  note.find(qry).limit(1).next(function(err, result) {
    if (err) {
      return resultCall(answer.fail(err.message));
    }

    if (!result) {
      return resultCall(answer.fail('Note not exists.'));
    }

    return resultCall(answer.succ(note.make(result, true)));
  });
};

/**
 *
 * @param noteId
 * @param aNote
 * @param resultCall
 * @param tagOpt    1 set, 2 add, 3 remove
 */
note.updateBy = function (noteId, aNote, resultCall, requestInfo, tagOpt) {
  delete aNote._id;
  tagOpt = tagOpt || 1;

  var qry = note.idQueryParam(noteId);
  if (!requestInfo.usr.isAdmin) {
    _.extend(qry, {
      state: 1,
      'create_by.id': requestInfo.usr.id
    });
  }

  async.waterfall([
    function(callback) {
      note.find(qry).limit(1).next(function(err, result) {
        if (err) {
          return resultCall(answer.fail(err.message));
        }

        if (!result) {
          return resultCall(answer.fail('note not exists.'));
        }

        var theTags = items.arrays(result.tags, aNote.tags || [], tagOpt);
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
      noteId = itemObj._id.toString();
      note.updateById(noteId, {$set: target}, function (err) {
        if (err) {
          return resultCall(answer.fail(err.message));
        }

        note.findById(noteId, function (errU, updated) {
          if (errU || !updated) {
            callback(null, note.make(_.extend(itemObj, target)));
          } else {
            callback(null, note.make(updated));
          }
        });
      });
    }
  ], function (err, result) {
    return resultCall(answer.succ(result));
  });

};

note.fastNote = function (params, resultCall, requestInfo) {
  var aNote = _.extend({
    title: null,
    summary: null,
    content: null,

    state: 1,
    tags: [],
    create_by: {
      id: requestInfo.usr.id,
      name: requestInfo.usr.name
    },
    last_modify_time: new Date(),
    create_time: new Date()
  }, params || {});

  if (!aNote.title || !aNote.summary || !aNote.content) {
    return resultCall(answer.fail('Invalid note, write something first'));
  }

  delete aNote._id;
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
          callback(null, answer.succ(note.make(target)));
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
    state: 1,
    'create_by.id': requestInfo.usr.id
  });

  var qryOpts = {
    fields: {
      content: 0,
      create_by: 0
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

