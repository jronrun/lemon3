/**
 *
 */
var mirror = require('../js/notemirror'),
  files = require('../js/files');

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

      fullscreenTgl: function (params, evt, el) {
        var full = note.instance.attrs('gutters') || [], lineNumbers = null, gutters = null, foldGutter = null;
        if (full.length == 0) {
          full = 0;
          foldGutter = true;
          lineNumbers = true;
          gutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'];
        } else {
          full = 1;
          foldGutter = false;
          lineNumbers = false;
          gutters = [];
        }

        note.instance.attrs({
          foldGutter: foldGutter,
          lineNumbers: lineNumbers,
          gutters: gutters
        });
      },

      preview: function () {
        lemon.preview(note.instance.selected(), function () {
          note.menu.action.menuHide();
          $(note.menu.triId).hide();
        }, false, false, false, {
          hidden: function () {
            $(note.menu.triId).show();
          }
        });
      },
      newNote: function () {

      },
      shareNote: function () {

      },
      saveNote: function () {

      },
      saveNoteAs: function () {
        files.saveAs(note.instance.val(), note.instance.target.getLine(0) + '.note');
      },
      closeNote: function () {

      },
      saveAndCloseNote: function () {

      },
      openFile: function () {
        $('#note_open_file').click();
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
            note.menu.item('New', ':n', 'visual & edit', 'New Note (:new)', 'newNote'),
            note.menu.item('Open File...', ':o', 'visual & edit', 'Open File (:open)', 'openFile'),
            note.menu.item('separator'),
            note.menu.item('Close Menu', ':menu', 'visual & edit', 'Close Menu', 'menuHide'),
            note.menu.item('Close Note', ':q', 'visual & edit', 'Close Note', 'closeNote', false, true),
            note.menu.item('Share Note', ':share', 'visual & edit', 'Share Note', 'shareNote'),
            note.menu.item('Preview', ':v', 'visual & edit', 'Preview (:view)', 'preview'),
            note.menu.item('Fullscreen', ':full', 'visual & edit', 'Toggle Fullscreen (:fullscreen)', 'fullscreenTgl'),
            note.menu.item('separator'),
            note.menu.item('Save Note', ':w', 'visual & edit', 'Save Note (:w)', 'saveNote'),
            note.menu.item('Save & Close Note', ':wq', 'visual & edit', 'Save & Close Note', 'saveAndCloseNote', false, true),
            note.menu.item('Save As...', ':sa', 'visual & edit', 'Save Note As...', 'saveNoteAs'),
            note.menu.item('empty', 80)
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
        },
        {
          type: 'dropdown',
          ddName: 'Note',
          id: 'menu_dd_note'
        },
        {
          type: 'dropdown',
          ddName: 'Language',
          id: 'menu_dd_mode'
        },
        {
          type: 'dropdown',
          ddName: 'Theme',
          id: 'menu_dd_theme'
        },
        {
          type: 'dropdown',
          ddName: 'Help',
          id: 'menu_dd_help',
          items: [

          ]
        }
      ];
    },

    render: {
      note: function () {

      },
      theme: function () {
        $('#menu_dd_theme_dd').empty().append(lemon.tmpl($('#menu_theme_tmpl').html(), {
          themes: mirror.mirrors.themes,
          thistheme: note.instance.theme()
        }));
      },
      lang: function () {
        $('#menu_dd_mode_dd').empty().append(lemon.tmpl($('#menu_lang_tmpl').html(), {
          langs: mirror.mirrors.languages,
          thislang: note.instance.mode()
        }));
      }
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

      var themeSel = 'div[data-theme]', langSel = 'div[data-lang]', langInfoSel = 'a[data-lang-info]';
      lemon.rightclick(themeSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget;
        note.instance.theme(lemon.data(el, 'theme'));
      });

      lemon.live('click', themeSel, function (evt) {
        var el = evt.currentTarget, th = lemon.data(el, 'theme');
        note.instance.theme(th);
        note.menu.render.theme();
      });

      lemon.rightclick(langSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget, lang = lemon.data(el, 'lang');
        note.instance.mode(lang.name);
      });

      lemon.live('click', langSel, function (evt) {
        var el = evt.currentTarget, lang = lemon.data(el, 'lang');
        note.instance.mode(lang.name);
        note.menu.render.lang();
      });

      lemon.rightclick(langInfoSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget, langInfo = lemon.data(el, 'langInfo'),
          lang = note.instance.langInfo(langInfo);
        note.instance.mode(lang.name, langInfo);
      });

      lemon.live('click', langInfoSel, function (evt) {
        var el = evt.currentTarget, langInfo = lemon.data(el, 'langInfo'),
          lang = note.instance.langInfo(langInfo);
        note.instance.mode(lang.name, langInfo);
        note.menu.render.lang();
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
          var viewport = lemon.viewport();

          if (viewport.smallDown) {
            var ddElOffset = $(ddEl).offset(), offsetW = -ddElOffset.left, ddBodyW = $(ddBody).width();

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
              'max-height': viewport.h * 0.8,
              'overflow-y': 'scroll'
            });
          }

          $(ddBody).slideDown();

          if (1 != lemon.data(ddEl, 'evented') && viewport.smallDown) {
            var ddBodyOffset = $(ddBody).offset(), toolbarOffset = $(note.menu.popoverId).offset();
            var holdPos = function (e) {
              e.preventDefault();
              $(ddBody).offset(ddBodyOffset);
              $(note.menu.popoverId).offset(toolbarOffset);
            };

            $(ddBody).scroll(holdPos);
            $(ddBody).resize(holdPos);
            lemon.data(ddEl, {evented: 1})
          }
        },
        hidden: function (tri, body) {

        }
      });

      files.read('#note_open_file', function(context){
        note.instance.val('');
        note.instance.val(context);
      });

      note.menu.instance = lemon.popover(note.menu.id, {
        trigger: 'manual',
        placement: 'right',
        arrow: false,
        constraints: [
          {
            to: 'window',
            attachment: 'together'
          }
        ],
        content: function () {
          return lemon.tmpl($('#note_tool_tmpl').html(), {
            menus: note.menu.source()
          });
        }
      }, {
        inserted: function (el) {
          $(el).hide();
        },
        shown: function (el) {
          var viewport = lemon.viewport(), w = 0;
          if (viewport.mediumUp) {
            w = Math.floor(viewport.w / 1.8);
          } else {
            w = viewport.w;
          }

          $(el).css({
            width: w,
            'max-width': w,
            border: 0,
            'margin-left': 0,
            top: 1,
            left: (viewport.w - w),
            'z-index': 50001
          });
          $(el).find('.popover-content').css({
            'padding': 0
          });
          note.menu.popoverId = '#' + $(el).attr('id');

          note.menu.render.lang();
          note.menu.render.theme();
          note.menu.render.note();
          $(el).slideDown();

          if (1 != lemon.data(note.menu.id, 'evented') && viewport.smallDown) {
            var toolbarOffset = $(note.menu.popoverId).offset();
            var holdPos = function (e) {
              e.preventDefault();
              $(note.menu.popoverId).offset(toolbarOffset);
            };

            $(window).resize(holdPos);
            lemon.data(note.menu.id, {evented: 1})
          }
        }
      });

      $(note.menu.triId).click(function () {
        note.menu.tgl();
      });
    }
  },

  snapshoot: function () {

  },
  snapload: function (snapData) {

  },

  initialize: function () {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    note.instance = mirror(note.id);
    note.menu.intl();

    lemon.subMsg(function (data) {
      // lemon.info(data, 'Note received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'MODAL':
            break;
        }
      }
    });

    //TODO remove
    global.note = note;
    global.mirror = mirror;
    global.files = files;
    //TODO remove


  }
};

$(function () { note.initialize(); });
