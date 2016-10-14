/**
 *
 */

var summer = require('../js/summernote'),
  files = require('../js/files'),
  sharing =  require('../js/sharing');

function leave() {
  lemon.persist('rich_snapshoot', rich.snapshoot());
}

var rich = {
  instance: null,
  summer: {
    //type 1 air, 2 normal
    option: function (type) {
      var ui = $.summernote.ui, modeTgl = function (context, airMode) {
        return ui.button({
          contents: '<em class="fa fa-toggle-on"></em>',
          tooltip: '',
          click: function () {
            rich.instance = rich.instance.refresh({
              airMode: airMode
            });
          }
        }).render();
      }, toolBtns = function (target, isAddHead) {
        var btns = [
          ['style', ['style']],
          ['font', ['bold', 'underline', 'clear']],
          ['fontname', ['fontname']],
          ['color', ['color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['table', ['table']],
          ['insert', ['link', 'picture', 'video', 'help']]
        ];

        if (isAddHead) {
          btns.unshift(target);
        } else {
          btns.push(target);
        }

        return btns;
      };

      var buttons = {
        tonor: function (context) {
          return modeTgl(context, false);
        },
        toair: function (context) {
          return modeTgl(context, true);
        }
      }, toolbarB = toolBtns(['view', ['toair']]);

      switch (type = type || 1) {
        case 1:
          var aribarB = toolBtns(['view', ['tonor']]);

          return {
            buttons: buttons,
            toolbar: toolbarB,
            airMode: true,
            popover: {
              air: aribarB
            }
          };

        case 2:
          return {
            buttons: buttons,
            toolbar: toolbarB
          };
      }
    },
    intl: function (type) {
      rich.instance = summer('#rich_view', rich.summer.option(type));
    },
  },

  snapshoot: function () {

  },
  snapload: function (snapdata) {

  },
  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    rich.summer.intl();

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

//TODO remove
global.$ = $;
global.rich=rich;
global.summer = summer;

$(function () { rich.initialize(); });
