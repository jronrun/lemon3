/**
 *
 */
// var mirror = require('../js/notemirror');
// require('summernote/dist/summernote.css');
// require('summernote');

var files = require('../js/files'),
  sharing =  require('../js/sharing');

function leave() {
  lemon.persist('rich_snapshoot', rich.snapshoot());
}

var rich = {

  snapshoot: function () {

  },
  snapload: function (snapdata) {

  },
  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }


    if (lemon.isRootWin()) {
      rich.snapload();
    }

    lemon.subMsg(function (data) {
      // lemon.info(data, 'Rich received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'SNAPSHOOT':
            var shoot = {};
            shoot[data.iframe.name] = {
              id: evtData.id,
              iframe: {
                type: 5,
                isDefault: evtData.isDefault,
                name: evtData.tabName,
                src: data.iframe.src
              },
              snapdata: rich.snapshoot()
            };
            lemon.persist('rich_snapshoot', shoot);
            break;
          case 'LEAVE':
            leave();
            break;
          case 'SNAPLOAD':
            rich.snapload(evtData.snapdata);
            break;
        }
      }
    });

    lemon.unload(function () {
      if (lemon.isRootWin()) {
        leave();
      }
    });
  }
};

$(function () { rich.initialize(); });
