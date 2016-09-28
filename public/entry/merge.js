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
            mni_item('Save As New Note...', false, false, 'Save As an New Note...', 'saveAsNote'),
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

        {
          type: 'dropdown',
          ddName: 'Language',
          id: 'menu_dd_mode'
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

  theme: {
    change: function (aTheme) {
      merge.instance.actions(function (anInst) {
        anInst.theme(aTheme);
      });
    }
  },
  lang: {
    change: function (aLang, langInfo) {
      merge.instance.actions(function (anInst) {
        anInst.mode(aLang, langInfo || '');
      });
    }
  },

  render: {
    intl: function () {
      merge.lang.change('text');
      merge.theme.change('lemon');
      merge.render.lang();

      var langSel = 'div[data-lang]', langInfoSel = 'a[data-lang-info]';

      lemon.rightclick(langSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget, lang = lemon.data(el, 'lang');
        merge.lang.change(lang.name);
      });

      lemon.live('click', langSel, function (evt) {
        if (merge.langInfoSel) {
          merge.langInfoSel = false;
          return;
        }
        var el = evt.currentTarget, lang = lemon.data(el, 'lang');
        merge.lang.change(lang.name);
        merge.render.lang();
      });

      lemon.rightclick(langInfoSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget, langInfo = lemon.data(el, 'langInfo'),
          lang = mirror.mirrors.modeInfo(langInfo);
        merge.lang.change(lang.name, langInfo);
      });

      lemon.live('click', langInfoSel, function (evt) {
        merge.langInfoSel = true;
        var el = evt.currentTarget, langInfo = lemon.data(el, 'langInfo'),
          lang = mirror.mirrors.modeInfo(langInfo);
        merge.lang.change(lang.name, langInfo);
        merge.render.lang();
      });


      lemon.live('keyup', '#note_mode_qry', function(evt) {
        var val = $(evt.currentTarget).val(), blastSel = '#menu_dd_mode_dd';
        if (lemon.isBlank(val)) {
          lemon.blastReset(blastSel);
          $(langSel).show();
          return;
        }

        var ids = [], regEx = new RegExp(val), ismatch = false;
        lemon.each(mirror.mirrors.languages, function(lang, idx) {
          ismatch = false;
          if (ismatch = regEx.test(lang.name)) {
          } else if (ismatch = regEx.test(lang.mode)) {
          } else if (ismatch = regEx.test(lang.mime)) {
          }

          if (!ismatch) {
            lemon.each(lang.mimes || [], function(mime, idx) {
              if (ismatch) { return false; }
              if (ismatch = regEx.test(mime)) { }
            });
          }

          if (!ismatch) {
            lemon.each(lang.ext || [], function(ext, idx) {
              if (ismatch) { return false; }
              if (ismatch = regEx.test(ext)) { }
            });
          }

          if (!ismatch) {
            lemon.each(lang.alias || [], function(alias, idx) {
              if (ismatch) { return false; }
              if (ismatch = regEx.test(alias)) { }
            });
          }

          if (!ismatch && lang.file) {
            ismatch = lang.file.test(val);
          }

          if (ismatch) {
            ids.push('#lang_' + lang.id);
          }
        });

        $(langSel).hide();
        $(ids.join(',')).show();

        lemon.blast(val, blastSel);
      });

      lemon.dropdownEvent('li[id^="menu_dd_"]', {
        show: function (ddEl, ddBody) {
          $(ddBody).hide();
        },
        shown: function (ddEl, ddBody) {
          var viewport = lemon.viewport(), ddBodyW = $(ddBody).width();

          if (viewport.smallDown) {
            var ddElOffset = $(ddEl).offset(), offsetW = -ddElOffset.left;

            if (viewport.w < ddBodyW) {
              ddBodyW = viewport.w - 10;
              offsetW = offsetW + 5;
            } else {
              offsetW = offsetW + ((viewport.w - ddBodyW) / 2);
            }

            $(ddBody).css({
              left: offsetW,
              width: ddBodyW,
              'max-width': ddBodyW,

              // height: viewport.h * 0.85,
              'max-height': viewport.h * 0.85,
              'overflow-y': 'scroll'
            });

          } else {
            $(ddBody).css({
              //width: viewport.w * 0.25,
              // height: viewport.h * 0.8,
              'max-width': ddBodyW,
              'max-height': viewport.h * 0.8,
              'overflow-y': 'scroll'
            });
          }

          $(ddBody).slideDown();
        },
        hidden: function (tri, body) {

        }
      });
    },
    lang: function () {
      $('#menu_dd_mode_dd').empty().append(lemon.tmpl($('#menu_lang_tmpl').html(), {
        langs: mirror.mirrors.languages,
        thislang: merge.instance.left.mode()
      }));
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
    refresh: function (type, options) {
      var inst = null, minst = merge.instance;
      switch (type = type || 1) {
        case 1:
          var elId = '#merge_view', navH = $(merge.nav.id).height(),
            height = $(window).height() - navH - 25, top = navH + 14; $(elId).empty();

          merge.instance = mirror.merge(lemon.extend({ elId: elId}, options || {}, {
            top: top,
            height: height
          }), {
            fullscreen: function(isFullscreen) {
              $(merge.nav.id).toggle(!isFullscreen);
            }
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

      if (1 != type) {
        merge.instance = inst;
      }

      return merge.instance;
    },
  },

  snapshoot: function () {
    var inst = merge.instance, m = inst.left.mode(), th = inst.left.theme(), snapdata = {
      info: {
        mime: m.chosenMimeOrExt || m.mime,
        theme: th
      }
    };

    var vals = inst.viewVals();
    if (vals.is2Panels) {
      delete vals.middle;
    }

    lemon.extend(snapdata, {
      vals: vals,
      merge: lemon.extend({}, inst.attrs(), inst.target.extras)
    });

    lemon.each(['elId', 'top', 'height', 'orig', 'origLeft', 'value'], function (prop) {
      delete snapdata.merge[prop];
    });

    return snapdata;
  },
  snapload: function (snapdata) {
    snapdata = snapdata ? lemon.deepDec(snapdata) : lemon.persist('merge_snapshoot');
    var info = null, mi = null, vals = null;
    if (mi = snapdata.merge) {
      merge.action.refresh(1, mi);
    }

    if (vals = snapdata.vals) {
      merge.instance.left.val(vals.left);
      merge.instance.right.val(vals.right);
      if (!vals.is2Panels) {
        merge.instance.middle.val(vals.middle);
      }
    }

    if (info = snapdata.info) {
      merge.theme.change(info.theme);
      merge.lang.change(info.mime, info.mime);
      merge.render.lang();
    }
  },
  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    merge.nav.intl();
    merge.action.refresh();
    merge.render.intl();

    if (lemon.isRootWin()) {
      merge.snapload();
    }

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
