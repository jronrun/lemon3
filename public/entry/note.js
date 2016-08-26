/**
 *
 */
var mirror = require('../js/notemirror');

var note = {
  id: '#note_textarea',
  instance: null,

  menu: {
    id: '#note_tool',
    instance: null,

    action: {
      newNote: function () {

      },
      openFile: function () {

      }
    },

    item: function(name, cmd, desc, title, action, params) {
      if ('separator' == name) {
        return { name: name };
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

    /**
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.menuTgl();" title="Mouse move left toggle menu"><%= menu('Close Menu', ':menu', 'visual') %></a>
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.close();" title="Close Note"><%= menu('Close Note', ':q', 'visual') %></a>
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.share();" title="Share Note to Browser Address"><%= menu('Share Note', ':share', 'visual') %></a>
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.preview();" title=":view"><%= menu('Preview', ':v', 'visual') %></a>
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.fulltgl();" title=":fullscreen"><%= menu('Fullscreen', ':full', 'visual') %></a>
     <div class="dropdown-divider"></div>
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.save();" title="Save Note"><%= menu('Save Note', ':w', 'visual') %></a>
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.saveclose();" title="Save & Close Note"><%= menu('Save & Close Note', ':wq', 'visual') %></a>
     <a class="dropdown-item" href="javascript:void(0);" onclick="note.save(null, 1);" title="Save As..."><%= menu('Save As...', ':sa', 'visual') %></a>
     <div><%= lemon.repeat('&nbsp;', 80) %></div>
     */

    source: function () {
      return [
        {
          type: 'dropdown',
          ddName: 'File',
          items: [
            note.menu.item('New', ':n', 'visual', 'New Note (:new)', 'newNote'),
            note.menu.item('Open File...', ':o', 'visual', 'Open File (:open)', 'openFile'),
            note.menu.item('separator')
          ]
        },
        {
          type: 'link',
          item: note.menu.item('New', false, false, 'New Note (:new)', 'newNote')
        }
      ]
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

      $('#note-tool-tri').click(function () {
        if (lemon.buttonTgl(this)) {
          note.menu.instance.show();
        } else {
          note.menu.instance.hide();
        }
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
