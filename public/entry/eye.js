/**
 *
 */

var eye = {

  initialize: function() {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    lemon.subMsg(function (data) {
      // lemon.info(data, 'Eye received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'FILL_CONTENT':
            break;
        }
      }
    });
  }
};

$(function () { eye.initialize(); });
