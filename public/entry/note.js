/**
 *
 */
var mirror = require('../js/notemirror');

var note = {
  id: '#note_textarea',
  instance: null,

  menu: {
    id: '#note_tool',
    triId: '#note-tool-tri',
    instance: null,

    action: {
      menuHide: function () {
        return note.menu.tgl(3);
      },
      menuShow: function () {
        return note.menu.tgl(2);
      },
      menuClose: function () {
        note.menu.action.menuHide();
        if (!lemon.isRootWin()) {
          lemon.pubEvent('MENU_CLOSE');
        }
      },

      fullscreenTgl: function () {
        lemon.screenfull(function (full) {
          if (full) {
            note.menu.action.menuHide();
          }
        });
      },

      preview: function () {

      },
      newNote: function () {

      },
      shareNote: function () {

      },
      saveNote: function () {

      },
      saveNoteAs: function () {

      },
      closeNote: function () {

      },
      saveAndCloseNote: function () {

      },
      openFile: function () {

      },


      undo: function () {

      },
      redo: function () {

      },
      editMode: function () {
        note.instance.vim.editMode();
      },
      visualMode: function () {
        note.instance.vim.visualMode();
      },
      wrapword: function () {

      },
      commentTgl: function () {

      },
      foldCodeTgl: function () {

      },
      contentAssist: function () {

      },
      matchTag: function () {

      },
      selectAll: function () {

      },
      find: function () {

      },
      findNext: function () {

      },
      findPrev: function () {

      },
      replace: function () {

      },
      replaceAll: function () {

      },
      jumpToLine: function () {

      }
    },

    tgl: function (opt) {
      //1 toggle, 2 active, 3 unactive
      var isOpened = note.menu.instance.opened();
      opt = opt || 1; switch (opt) {
        case 1:
          note.menu.instance.toggle();
          break;
        case 2:
          if (!isOpened) {
            note.menu.instance.show();
          }
          break;
        case 3:
          if (isOpened) {
            note.menu.instance.hide();
          }
          break;
      }

      isOpened = note.menu.instance.opened();
      lemon.buttonTgl(note.menu.triId, isOpened ? 2 : 3);
      return isOpened;
    },

    item: function(name, cmd, desc, title, action, params, onlyShowInChildWin) {
      if (onlyShowInChildWin) {
        if (lemon.isRootWin()) {
          return { name: 'none' };
        }
      }

      if ('separator' == name) {
        return { name: name };
      }

      if ('empty' == name) {
        return { name: name, repeat: cmd };
      }

      var text = [ name ];
      if (desc) {
        text.push(lemon.format('<span class="text-info" style="float:right;position:relative;font-size:55%;">{0}</span>', desc));
      }
      if (cmd) {
        text.push(lemon.format('<span class="text-info" style="float:right;position:relative;">{0}&nbsp;</span>', cmd));
      }

      return {
        name: name,
        text: text.join(''),
        title: title || '',
        action: lemon.enc(action || ''),
        params: lemon.enc(params || {}),
      };
    },

    source: function () {
      return [
        /* { type: 'link', item: note.menu.item('New', false, false, 'New Note (:new)', 'newNote') } */
        {
          type: 'dropdown',
          ddName: 'File',
          id: 'menu_dd_file',
          items: [
            note.menu.item('New', ':n', 'visual', 'New Note (:new)', 'newNote'),
            note.menu.item('Open File...', ':o', 'visual', 'Open File (:open)', 'openFile'),
            note.menu.item('separator'),
            note.menu.item('Close Menu', ':menu', 'visual', 'Close Menu', 'menuHide'),
            note.menu.item('Close Note', ':q', 'visual', 'Close Note', 'closeNote', false, true),
            note.menu.item('Share Note', ':share', 'visual', 'Share Note', 'shareNote'),
            note.menu.item('Preview', ':v', 'visual', 'Preview (:view)', 'preview'),
            note.menu.item('Fullscreen', ':full', 'visual', 'Toggle Fullscreen (:fullscreen)', 'fullscreenTgl'),
            note.menu.item('separator'),
            note.menu.item('Save Note', ':w', 'visual', 'Save Note (:w)', 'saveNote'),
            note.menu.item('Save & Close Note', ':wq', 'visual', 'Save & Close Note', 'saveAndCloseNote', false, true),
            note.menu.item('Save As...', ':sa', 'visual', 'Save Note As...', 'saveNoteAs'),
            note.menu.item('empty', 180)
          ]
        },

        {
          type: 'dropdown',
          ddName: 'Edit',
          id: 'menu_dd_edit',
          items: [
            note.menu.item('Undo', 'u', 'visual', 'Undo (:undo)', 'undo'),
            note.menu.item('Redo', 'Ctrl-R', 'visual', 'Redo (:redo)', 'redo'),
            note.menu.item('separator'),
            note.menu.item('Edit Mode', 'i', 'visual', 'Edit Mode', 'editMode'),
            note.menu.item('Visual Mode', 'Esc', 'edit', 'Visual Mode', 'visualMode'),
            note.menu.item('separator'),
            note.menu.item('Word Wrap', ':wrap', 'visual', 'Word Wrap (:wrapword)', 'wrapword'),
            note.menu.item('Toggle Comment', 'Ctrl-/', 'visual & edit', 'Toggle Comment', 'commentTgl'),
            note.menu.item('Toggle Fold Code', 'Ctrl-Q', 'visual & edit', 'Toggle Fold Code', 'foldCodeTgl'),
            note.menu.item('Content Assist', 'Ctrl-J', 'visual & edit', 'Content Assist', 'contentAssist'),
            note.menu.item('Matching Tag', 'Ctrl-K', 'visual & edit', 'To Matching Tag', 'matchTag'),
            note.menu.item('separator'),
            note.menu.item('Select All', 'Ctrl-A', 'visual & edit', 'Select All', 'selectAll'),
            note.menu.item('Find...', 'Cmd-F', 'edit', 'Find... (/)', 'find'),
            note.menu.item('Find Next', 'Cmd-G', 'edit', 'Find Next (n)', 'findNext'),
            note.menu.item('Find Previous', 'Shift-Cmd-G', 'edit', 'Find Previous (shift + n)', 'findPrev'),
            note.menu.item('Replace...', 'Cmd-Alt-F', 'edit', 'Replace... (:%s/)', 'replace'),
            note.menu.item('Replace All', 'Shift-Cmd-Alt-F', 'edit', 'Replace All (:%s/)', 'replaceAll'),
            note.menu.item('Jump To Line', 'Alt-G', 'edit', 'Jump To Line (:jump)', 'jumpToLine'),
            note.menu.item('empty', 80)
          ]
        }
      ];
    },

    intl: function () {
      lemon.live('click', 'a[data-menuact]', function (evt, el) {
        evt.preventDefault();
        var anEl = 'A' == el.tagName ? el : $(el).parent(),
          act = lemon.data(anEl, 'menuact'), menuHandle = null;

        if (lemon.isFunc(menuHandle = note.menu.action[act])) {
          menuHandle(lemon.data(anEl, 'params'), evt, el);
        }
      });

      lemon.dropdownEvent('li[id^="menu_dd_"]', {
        show: function (ddEl, ddBody) {
          $(ddBody).hide();
        },
        shown: function (ddEl, ddBody) {
          var viewport = {
            w: $(window).width(),
            h: $(window).height()
          };

          if (lemon.isSmallDownView()) {
            var ddElOffset = $(ddEl).offset(), offsetW = -ddElOffset.left,
              ddBodyW = $(ddBody).width(), ddBodyH = $(ddBody).height();

            if (viewport.w < ddBodyW) {
              ddBodyW = viewport.w;
            } else {
              offsetW = offsetW + ((viewport.w - ddBodyW) / 2);
            }

            $(ddBody).css({
              left: offsetW,
              width: ddBodyW,
              'max-width': ddBodyW,

              height: viewport.h * 0.7,
              'max-height': viewport.h * 0.7,
              'overflow-y': 'scroll'
            });
          } else {
            $(ddBody).css({
              //width: viewport.w * 0.25,
              height: viewport.h * 0.8,
              'max-height': viewport.h * 0.8,
              'overflow-y': 'scroll'
            });
          }

          $(ddBody).slideDown();
        },
        hidden: function (tri, body) {

        }
      });


      note.menu.instance = lemon.popover(note.menu.id, {
        trigger: 'manual',
        placement: 'top',
        arrow: false,
        content: function () {
          return lemon.tmpl($('#note_tool_tmpl').html(), {
            menus: note.menu.source(),
            notesource: {
              langs: mirror.mirrors.languages,
              themes: mirror.mirrors.themes
            },
            thislang: note.instance.mode().name,
            thistheme: note.instance.theme()
          });
        }
      }, {
        inserted: function (el) {
          $(el).hide();
        },
        shown: function (el) {
          var viewport = {
            w: $(window).width(),
            h: $(window).height()
          }, w = lemon.isMediumUpView() ? Math.floor(viewport.w / 1.8) : (viewport.w - 5);

          $(el).css({
            width: w,
            'max-width': w,
            border: 0,
            top: 11,
            left: (viewport.w - w - 2),
            'z-index': 50001
          });
          $(el).find('.popover-content').css({
            'padding': 0
          });
          $(el).slideDown();
        }
      });

      $(note.menu.triId).click(function () {
        note.menu.tgl();
      });
    }
  },

  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    note.instance = mirror(note.id);
    note.menu.intl();

    //TODO remove
    global.note = note;
    global.mirror = mirror;
    //TODO remove


  }
};

$(function () { note.initialize(); });
