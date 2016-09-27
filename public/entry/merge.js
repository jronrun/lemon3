/**
 *
 */
var mirror = require('../js/notemirror'),
  files = require('../js/files'),
  sharing =  require('../js/sharing');

function leave() {
  lemon.persist('merge_snapshoot', merge.snapshoot());
}

var merge = {

  nav: {
    id: '#merge_nav',

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
        /* { type: 'link', item: merge.nav.item('New', false, false, 'New Note (:new)', 'newNote') } */
        {
          type: 'dropdown',
          ddName: 'File',
          id: 'menu_dd_file',
          items: [
            merge.nav.item('New', ':n', 'visual & edit', 'New Note (:new)', 'newNote'),
            merge.nav.item('Save & New', ':wn', 'visual & edit', 'Save & New Note (:wnew)', 'saveAndNewNote'),
            merge.nav.item('As New', ':asn', 'visual & edit', 'Current As New Note (:asnew)', 'curAsNewNote'),
            merge.nav.item('Open File...', ':o', 'visual & edit', 'Open File (:open)', 'openFile'),
            merge.nav.item('separator'),
            merge.nav.item('Close Menu', ':menu', 'visual & edit', 'Close Menu', 'menuTgl'),
            merge.nav.item('Close Note', ':q', 'visual & edit', 'Close Note', 'closeNote', false, true),
            merge.nav.item('Share Note', ':share', 'visual & edit', 'Share Note', 'shareNote'),
            merge.nav.item('Preview', ':v', 'visual & edit', 'Preview (:view)', 'preview'),
            merge.nav.item('Fullscreen', 'Ctrl-L', 'visual & edit', 'Toggle Fullscreen (:fullscreen)', 'fullscreenTgl'),
            merge.nav.item('separator'),
            merge.nav.item('Note Info', ':info', 'visual & edit', 'Note Info', 'noteInfo'),
            merge.nav.item('Save Note', ':w', 'visual & edit', 'Save Note (:w)', 'saveNote'),
            merge.nav.item('Save Note With...', ':ww', 'visual & edit', 'Save Note With Custom (:ww)', 'saveNoteCust'),
            merge.nav.item('Save & Close Note', ':wq', 'visual & edit', 'Save & Close Note', 'saveAndCloseNote', false, true),
            merge.nav.item('Save As...', ':sa', 'visual & edit', 'Save Note As...', 'saveNoteAs'),
            merge.nav.item('empty', 80)
          ]
        },

        {
          type: 'dropdown',
          ddName: 'Edit',
          id: 'menu_dd_edit',
          items: [
            merge.nav.item('Undo', 'u', 'visual & edit', 'Undo (:undo)', 'undo'),
            merge.nav.item('Redo', 'Ctrl-R', 'visual & edit', 'Redo (:redo)', 'redo'),
            merge.nav.item('separator'),
            merge.nav.item('Edit Mode', 'i', 'visual', 'Edit Mode', 'editMode'),
            merge.nav.item('Visual Mode', 'Esc', 'edit', 'Visual Mode', 'visualMode'),
            merge.nav.item('separator'),
            merge.nav.item('empty', 80)
          ]
        },

        { type: 'action', item: merge.nav.item('<em class="fa fa-arrow-down"></em>', false, false, 'Go Next Diff', 'next') },
        { type: 'action', item: merge.nav.item('<em class="fa fa-arrow-up"></em>', false, false, 'Go Previous Diff', 'prev') }
      ];
    },

    intl: function () {
      lemon.tmpls('#merge_nav_tmpl', {
        menus: merge.nav.source()
      }, merge.nav.id);
    }
  },

  // type 1 new instance, 2 panelsTgl, 3 collapseTgl, 4 alignTgl, 5 refresh,
  //      6 allowEditOrigTgl, 7 revertButtonsTgl, 8 lineNumbersTgl, 9 differencesTgl
  refresh: function (type) {
    var inst = null, minst = merge.instance;
    switch (type = type || 1) {
      case 1: inst = mirror.merge({ elId: '#merge_view'}); break;
      case 2: inst = minst.panelsTgl(); break;
      case 3: inst = minst.collapseTgl(); break;
      case 4: inst = minst.alignTgl(); break;
      case 5: inst = minst.refresh(); break;
      case 6: inst = minst.allowEditOrigTgl(); break;
      case 7: inst = minst.revertButtonsTgl(); break;
      case 8: inst = minst.lineNumbersTgl(); break;
      case 9: inst = minst.differencesTgl(); break;
    }

    return merge.instance = inst;
  },

  snapshoot: function () {

  },
  snapload: function () {

  },
  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    if (lemon.isRootWin()) {
      merge.snapload();
    }

    merge.nav.intl();
    merge.refresh();

    lemon.subMsg(function (data) {
      // lemon.info(data, 'Merge received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'SNAPSHOOT':
            break;
          case 'SNAPLOAD':
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
global.merge = merge;
global.mirror = mirror;

$(function () { merge.initialize(); });
