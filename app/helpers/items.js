'use strict';

var log = log_from('items');

var types = {
  date: function(val) {
    return val ? datefmt(val) : val;
  }
};

var helper = {
  /**
   *
   * @param define
   * [{
          "title": "",
          "clazz": "",
          "prop": "",
          "type": ""
      }]
   * @param items
   * @returns
   * {
   *  defines: defines,
   *  items: [
   *    {
   *      id: 1,
   *      row: [
            {
              "title": "",
              "value": "",
              "clazz": "",
              "prop": ""
            }
          ]
   *    }
   *  ]
   * }
     */
  asShowData: function(defines, items) {
    var data = [];

    _.each(items || [], function (item) {
      var row = [];

      _.each(defines || [], function(define) {
        var val = _.isFunction(define.prop) ? define.prop(item) : (
          types[define.type] ? types[define.type](item[define.prop]) : item[define.prop]
        );

        row.push({
          title: define.title,
          clazz: define.clazz || '',
          value: val
        });
      });

      data.push({
        id: item.id || item['_id'],
        row: row
      });
    });

    return {
      defines: defines,
      items: data
    };
  }
};

module.exports = helper;
