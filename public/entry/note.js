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
        return note.menu.action.menuTgl(3);
      },
      menuShow: function () {
        return note.menu.action.menuTgl(2);
      },
      menuTgl: function (opt) {
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

      fullscreenTgl: function () {

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

      }
    },

    item: function(name, cmd, desc, title, action, params) {
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
          items: [
            note.menu.item('New', ':n', 'visual', 'New Note (:new)', 'newNote'),
            note.menu.item('Open File...', ':o', 'visual', 'Open File (:open)', 'openFile'),
            note.menu.item('separator'),
            note.menu.item('Close Menu', ':menu', 'visual', 'Close Menu', 'menuHide'),
            note.menu.item('Close Note', ':q', 'visual', 'Close Note', 'closeNote'),
            note.menu.item('Share Note', ':share', 'visual', 'Share Note', 'shareNote'),
            note.menu.item('Preview', ':v', 'visual', 'Preview (:view)', 'preview'),
            note.menu.item('Fullscreen', ':full', 'visual', 'Toggle Fullscreen (:fullscreen)', 'fullscreenTgl'),
            note.menu.item('separator'),
            note.menu.item('Save Note', ':w', 'visual', 'Save Note (:w)', 'saveNote'),
            note.menu.item('Save & Close Note', ':wq', 'visual', 'Save & Close Note', 'saveAndCloseNote'),
            note.menu.item('Save As...', ':sa', 'visual', 'Save Note As...', 'saveNoteAs'),
            note.menu.item('empty', 80)
          ]
        }
      ];
    },

    intl: function () {
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
          var w = Math.floor($(window).width() / 2);
          $(el).css({
            width: w,
            'max-width': w,
            border: 0,
            top: 11,
            left: (w - 2),
            'z-index': 50001
          });
          $(el).find('.popover-content').css({
            'padding': 0
          });
          $(el).slideDown();
        }
      });

      $(note.menu.triId).click(function () {
        note.menu.action.menuTgl();
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
