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
  action: {
    //0 self, 1 note, 2 share
    from: 0,
    fileId: '#load_file',
    saveAsNote: function () {
      var pg = lemon.homeProgress();
      switch (rich.action.from) {
        case 1:
          lemon.pubEvent('SAVE_RICH_NOTE', {
            note: {
              content: rich.instance.val()
            }
          }, function () {
            pg.end();
          });
          break;

        default:
          rich.saveNoteInst = lemon.preview(lemon.fullUrl('/note'), false, false, function (view, previewM) {
            view.tellEvent('SAVE_RICH_TO_NOTE', {
              th: 'lemon',
              note: {
                content: rich.instance.val(),
                language: {
                  name: 'html',
                  mime: 'text/html'
                }
              }
            }, function () {
              pg.end();
            });
          });
          break;
      }
    },
    share: function () {
      if (2 === rich.action.from) {
        return;
      }

      var shareData = {
        type: 9,
        content: rich.snapshoot()
      };

      lemon.preview(lemon.getUrl(lemon.fullUrl('/share/preview'), {
        data: lemon.enc(shareData)
      }));
    }
  },
  summer: {
    //type 1 air, 2 normal
    option: function (type, isReadonly) {
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
        open: function (context) {
          return ui.button({
            className: 'icondh',
            contents: '<em class="fa fa-folder-open"></em>',
            tooltip: 'Open File...',
            data: {
              act: 'open'
            },
            click: function () {
              if (rich.instance.isAirMode()) {
                rich.instance.airbarHide();
              }
              $(rich.action.fileId).click();
            }
          }).render();
        },
        saveAs: function (context) {
          return ui.button({
            className: 'icondh',
            contents: '<em class="fa fa-save"></em>',
            tooltip: 'Save As...',
            data: {
              act: 'saveas'
            },
            click: function () {
              if (rich.instance.isAirMode()) {
                rich.instance.airbarHide();
              }

              files.saveAs(rich.instance.val(), lemon.now() + '.html');
            }
          }).render();
        },
        save: function (context) {
          return ui.button({
            className: 'icondh',
            contents: '<em class="fa fa-lemon-o"></em>',
            tooltip: 'Save As an Note...',
            data: {
              act: 'save'
            },
            click: function () {
              if (rich.instance.isAirMode()) {
                rich.instance.airbarHide();
              }
              rich.action.saveAsNote();
            }
          }).render();
        },
        share: function (context) {
          return ui.button({
            className: 'icondh',
            contents: '<em class="fa fa-share-alt"></em>',
            tooltip: 'Share',
            data: {
              act: 'share'
            },
            click: function () {
              if (rich.instance.isAirMode()) {
                rich.instance.airbarHide();
              }
              rich.action.share();
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
      },
        toolbarB = toolBtns(['cust', ['open', 'saveAs', 'save', 'share']]),
        aribarB = toolBtns(['cust', ['open', 'saveAs', 'save', 'share']], true),
        imagePopover = [
          ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
          ['float', ['floatLeft', 'floatRight', 'floatNone']],
          ['remove', ['removeMedia']]
        ],
        linkPopover = [
          ['link', ['linkDialogShow', 'unlink']]
        ],
        summerOpts = {
          fullsize: true,
          buttons: isReadonly ? [] : buttons,
          toolbar: isReadonly ? [] : toolbarB,
          popover: {
            air: isReadonly ? [] : aribarB,
            image: isReadonly ? [] : imagePopover,
            link: isReadonly ? [] : linkPopover,
          }
        };

      switch (type = type || 1) {
        case 1:
          lemon.extend(summerOpts, {
            airMode: true
          });
          break;

        case 2:
          break;
      }

      return summerOpts;
    },
    noneShareBtn: function () {
      $('button[data-act="share"]').remove();
    },
    intl: function (type, isReadonly) {
      rich.instance = summer('#rich_view', rich.summer.option(type, isReadonly));
      if (!isReadonly && 2 === rich.action.from) {
        rich.summer.noneShareBtn();
      }
      if (isReadonly) {
        rich.instance.disable();
      }
    },
  },

  snapshoot: function () {
    var snapdata = {
      type: rich.instance.type,
      val: rich.instance.val()
    };

    return snapdata;
  },
  snapload: function (snapdata, isReadonly) {
    snapdata = snapdata ? lemon.deepDec(snapdata) : lemon.persist('rich_snapshoot');
    if (snapdata.type && lemon.has(snapdata, 'val')) {
      rich.summer.intl(snapdata.type, isReadonly);
      rich.instance.val(snapdata.val);
      return true;
    }

    return false;
  },
  shareShow: function (shareData) {
    $('#share_this').show({
      complete: function() {
        $('#share_this').click(function() {
          sharing.createAndShow(shareData);
        });
      }
    });
  },
  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    if (lemon.isRootWin()) {
      if (!rich.snapload()) {
        rich.summer.intl();
      }
    }

    lemon.subMsg(function (data) {
      // lemon.info(data, 'Rich received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'MAPI_NEW':
            rich.summer.intl();
            break;
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
            lemon.persist('mapi_snapshoot', shoot);
            break;
          case 'LEAVE':
            leave();
            break;
          case 'SNAPLOAD':
            rich.snapload(evtData.snapdata);
            break;
          case 'RICH_NOTE':
            rich.action.from = 1;
            rich.snapload(evtData.richData);
            break;
          case 'SHARE_RICH_SNAPSHOT':
            rich.action.from = 2;
            rich.summer.noneShareBtn();

            if (1 == evtData.preview) {
              rich.shareShow({
                title: 'Rich Snapshot',
                type: 9,
                content: evtData.content
              });
            }

            var isReadonly = true;
            if (1 == evtData.read_write) {

            } else {
              isReadonly = false;
            }

            rich.snapload(evtData.content, isReadonly);
            break;
          case 'NOTE_CLOSE':
            rich.saveNoteInst && rich.saveNoteInst.destroy();
            break;
        }
      }
    });

    files.read(rich.action.fileId, function(context){
      rich.instance.val(context);
    }, { accept: 'text/html'}, {
      skip: function (file) {
        lemon.alert(file.name + ' is not a html file.', 'Receive HTML File Only');
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
