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
      var ui = $.summernote.ui, toolBtns = function (target, isAirBar, isAddHead) {
        var btns = [
          ['lemon', ['logo']],
          ['style', ['style']],
          ['font', ['bold', 'underline', 'clear']],
          ['fontname', ['fontname']],
          ['color', ['color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['table', ['table']],
          ['insert', ['link', 'picture', 'video']],
          ['view', ['codeview', 'help']]
        ], airBtns = [
          ['lemon', ['logo']],
          ['color', ['color']],
          ['font', ['bold', 'underline', 'clear']],
          ['para', ['ul', 'paragraph']],
          ['table', ['table']],
          ['insert', ['link', 'picture']]
        ];

        if (isAddHead) {
          (isAirBar ? airBtns : btns).unshift(target);
        } else {
          (isAirBar ? airBtns : btns).push(target);
        }

        return (isAirBar ? airBtns : btns);
      };

      var buttons = {
        save: function (context) {
          return ui.button({
            className: 'icondh',
            contents: '<em class="fa fa-save"></em>',
            tooltip: 'Save As an Note...',
            click: function () {

            }
          }).render();
        },
        share: function (context) {
          return ui.button({
            className: 'icondh',
            contents: '<em class="fa fa-share-alt"></em>',
            tooltip: 'Share',
            click: function () {

            }
          }).render();
        },
        logo: function (context) {
          return ui.button({
            contents: lemon.tmpls('#rich_logo_tmpl'),
            tooltip: '',
            click: function () {
              rich.instance = rich.instance.modeTgl();
            }
          }).render();
        }
      }, toolbarB = toolBtns(['cust', ['save', 'share']]);

      switch (type = type || 1) {
        case 1:
          var aribarB = toolBtns(['cust', ['save', 'share']], true);
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
