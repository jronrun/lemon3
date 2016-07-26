
require('./../../dist/picker');
require('./../../dist/picker.css');


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
      elId = '#' + $(this).attr('id'), clockId = elId + '_clock';

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
