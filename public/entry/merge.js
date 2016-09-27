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
      var mni_item = merge.nav.item, tgl_item = function(name, title, action, params) {
        return mni_item(name, '<em class="fa fa-toggle-on"></em>', false, title, action, params);
      }, act_item = function (icon, title, action, params) {
        return {
          type: 'action',
          item: mni_item('<em class="fa fa-' + icon + '"></em>', false, false, title, action, params)
        };
      };

      return [
        /* { type: 'link', item: merge.nav.item('New', false, false, 'New Note (:new)', 'newNote') } */
        {
          type: 'dropdown',
          ddName: 'File',
          id: 'menu_dd_file',
          items: [
            mni_item('Open Left...', false, false, 'Open File for Left...', 'loadLeft'),
            mni_item('Open Right...', false, false, 'Open File for Right...', 'loadRight'),
            mni_item('separator'),
            mni_item('Save As...', false, false, 'Save As...', 'saveAs'),
            mni_item('Save Note', false, false, 'Save Note or Create an New Note Directly', 'saveNote'),
            mni_item('Save As Note...', false, false, 'Save As an New Note...', 'saveAsNote'),
            mni_item('empty', 60)
          ]
        },

        {
          type: 'dropdown',
          ddName: 'Edit',
          id: 'menu_dd_edit',
          items: [
            mni_item('Next Diff', false, false, 'Go Next Diff', 'next'),
            mni_item('Prev Diff', false, false, 'Go Previous Diff', 'prev'),
            mni_item('separator'),
            tgl_item('Collapse', 'Toggle Collapse Unchanged Fragments', 'refresh', 3),
            tgl_item('Panels', 'Toggle Two or Three Panels', 'refresh', 2),
            tgl_item('Align', 'Toggle Pad Changed Sections to Align Them', 'refresh', 4),
            tgl_item('Edit Originals', 'Toggle Allow Editing Originals', 'refresh', 6),
            tgl_item('Line Numbers', 'Toggle Line Numbers', 'refresh', 8),
            tgl_item('Highlight Differences', 'Toggle Highlight Differences', 'refresh', 9),
            mni_item('separator'),
            mni_item('empty', 60)
          ]
        },

        act_item('chevron-down', 'Go Next Diff', 'next'),
        act_item('chevron-up', 'Go Previous Diff', 'prev'),
        act_item('compress', 'Toggle Collapse Unchanged Fragments', 'refresh', 3),
        act_item('sliders', 'Toggle Two or Three Panels', 'refresh', 2),
        act_item('assistive-listening-systems', 'Toggle Pad Changed Sections to Align Them', 'refresh', 4),
        act_item('list-ol', 'Toggle Line Numbers', 'refresh', 8),
        act_item('lightbulb-o', 'Toggle Highlight Differences', 'refresh', 9),
        act_item('unlock-alt', 'Toggle Allow Editing Originals', 'refresh', 6)
      ];
    },

    intl: function () {
      lemon.live('click', 'a[data-menuact]', function (evt, el) {
        evt.preventDefault();
        var anEl = 'A' == el.tagName ? el : $(el).parent(),
          act = lemon.data(anEl, 'menuact'), menuHandle = null;

        if (lemon.isFunc(menuHandle = merge.action[act])) {
          menuHandle(lemon.data(anEl, 'params'), evt, el);
        } else if (lemon.isFunc(menuHandle = merge.instance[act])) {
          menuHandle();
        }
      });

      lemon.tmpls('#merge_nav_tmpl', {
        menus: merge.nav.source()
      }, merge.nav.id);
    }
  },

  action: {
    loadLeft: function () {

    },
    loadRight: function () {

    },

    saveNote: function () {

    },
    saveAsNote: function () {

    },
    saveAs: function () {

    },

    // type 1 new instance, 2 panelsTgl, 3 collapseTgl, 4 alignTgl, 5 refresh,
    //      6 allowEditOrigTgl, 7 revertButtonsTgl, 8 lineNumbersTgl, 9 differencesTgl
    refresh: function (type) {
      var inst = null, minst = merge.instance;
      switch (type = type || 1) {
        case 1:
          var navH = $(merge.nav.id).height(), height = $(window).height() - navH, top = navH + 14;
          inst = mirror.merge({
            top: top,
            height: height,
            elId: '#merge_view'
          });
          break;
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
    merge.action.refresh();

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
