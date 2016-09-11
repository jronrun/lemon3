'use strict';

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

  Note.page(query, options.pn, false, options.ps, qryOpts).then(function (result) {
    resultCall(answer.succ({
      items: result.items,
      hasNext: result.page.hasNext
    }));
  });
};

module.exports = note;

