
// require('./../../dist/picker');
// require('./../../dist/picker.css');

require('imports!pickadate/lib/picker');
require('imports?define=>false!pickadate/lib/picker.date');
require('imports?define=>false!pickadate/lib/picker.time');

require('pickadate/lib/themes/default.css');
require('pickadate/lib/themes/default.date.css');
require('pickadate/lib/themes/default.time.css');

module.exports = function(selector, options) {
  options = options || {};
  var dateOptions = lemon.extend({
    format: 'yyyy-mm-dd'
  }, options.dateOptions || {});

  var timeOptions = lemon.extend({
    format: 'HH:i'
  }, options.timeOptions || {});

  options = lemon.extend({

  }, options);

  $(selector).each(function () {
    var dtype = $(this).attr('datetype'), thiz = this;
    switch (dtype) {
      case 'date':
        $(thiz).pickadate(dateOptions);
        break;
      case 'time':
        $(thiz).pickatime(timeOptions);
        break;
      case 'datetime':
        break;
    }
  });
};
