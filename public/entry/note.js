/**
 *
 */
var mirror = require('../js/notemirror'),
  files = require('../js/files'),
  sharing =  require('../js/sharing');

var _current = {}, title_len = 30; function current(data) {
  //data { _id: '', title: '', content: '', summary: '', note: '', tags: [] }
  lemon.extend(_current, data || {});
  return _current;
}

function leave() {
  lemon.persist('note_snapshoot', note.snapshoot(true));
}

var note = {
  id: '#note_textarea',
  instance: null,

  action: {
    menuTgl: function () {
      return note.menu.tgl(1);
    },
    menuHide: function () {
      return note.menu.tgl(3);
    },
    menuShow: function () {
      return note.menu.tgl(2);
    },
    menuClose: function () {
      note.action.menuHide();
      if (!lemon.isRootWin()) {
        lemon.pubEvent('MENU_CLOSE');
      }
    },

    fullscreenTgl: function (params, evt, el) {
      note.instance.guttersTgl();
    },

    preview: function () {
      note.views(note.instance.selected());
    },
    joinline: function (params) {
      var start = 0, end = undefined;
      if (params.args) {
        var len = params.args.length;
        if (1 == len) {
          start = parseInt(params.args[0]) - 1;
        } else if (len > 1) {
          start = parseInt(params.args[0]) - 1;
          end = parseInt(params.args[1]) - 1;
        }
      }
      note.instance.vim.joinLine(start, end);
    },
    mode: function (params) {
      note.lang.change(params.get(0));
    },
    theme: function (params) {
      note.theme.change(params.get(0));
    },
    help: function (params) {
      var fromMenu = params && params.topic, topic = 'none', topicDef = null;
      if (fromMenu) {
        topic = params.topic;
      } else {
        topic = params.get(0, topic);
      }

      if ('none' == topic || !(topicDef = note.action.helps[topic])) {
        note.action.menuShow();
        lemon.dropdownTgl('#menu_dd_help_dd');
        return;
      }

      note.views(lemon.isFunc(topicDef.link) ? topicDef.link() : topicDef.link);
    },
    delNote: function (params) {
      var fromCmd = params.get, nid = fromCmd ? (params.get(0) || current()._id) : params.noteId;
      if (nid) {
        note.entity.del(nid, function () {
          if (fromCmd) {
            note.load(note.make());
            note.instance.tip('Note delete success');
          }
          note.menu.render.note(true);
        });
      }
    },
    editNote: function (params) {
      var nid = params.get ? params.get(0) : params.noteId;
      note.entity.loadById(nid);
    },
    newNote: function () {
      note.load(note.make());
    },
    saveAndNewNote: function () {
      note.entity.save({
        title: params.get ? params.get(0) : ''
      }, function () {
        note.action.newNote();
      });
    },
    sharedNote: function (params) {
      var nid = params.get(0), shareData = null;
      if (nid) {
        shareData = {
          title: 'Note',
          type: 4,
          content: nid
        };
      } else {
        var cData = current(); shareData = {
          title: 'Note Snapshot' + (cData.title ? (' of ' + cData.title) : ''),
          type: 5,
          content: note.snapshoot()
        };
      }

      sharing.createAndShow(shareData);
    },
    shareNote: function (params) {
      var fromCmd = params.get, shareData = null, nid = fromCmd ? params.get(0) : params.noteId;
      if (nid) {
        shareData = {
          type: 4,
          content: nid
        };
      } else {
        shareData = {
          type: 5,
          content: note.snapshoot()
        };
      }

      note.views(lemon.getUrl(lemon.fullUrl('/share/preview'), {
        data: lemon.enc(shareData)
      }));
    },
    saveNote: function (params) {
      note.entity.save({
        title: params.get ? params.get(0) : ''
      });
    },
    curAsNewNote: function () {
      current({ _id: ''});
    },
    saveNoteCust: function (params) {
      note.saveWith.show();
    },
    saveNoteAs: function (params) {
      var noteTitle = '';
      if (params.get && (noteTitle = params.get(0))) {
        if (noteTitle.indexOf('.') == -1) {
          noteTitle = noteTitle + '.note';
        }
      } else {
        noteTitle = (note.instance.target.getLine(0) || '').substr(0, title_len) + '.note';
      }
      files.saveAs(note.instance.val(), noteTitle);
    },
    closeNote: function () {
      if (lemon.isRootWin()) {
        note.load(note.make());
      } else {
        lemon.pubEvent('NOTE_CLOSE', {
          nid: current()._id || ''
        });
      }
    },
    saveAndCloseNote: function (params) {
      note.entity.save({
        title: params.get ? params.get(0) : ''
      }, function () {
        note.action.closeNote();
      });
    },
    noteInfo: function (params) {
      var nid = params.get ? params.get(0) : '', ashow = function (n) {
        n = note.make(n); if (lemon.isBlank(n.content)) {
          note.instance.tip('invalid note');
          return;
        }

        lemon.modal({
          modal: {
            show: true
          },
          body: function () {
            return note.menu.render.card({
              n: n,
              cnid: 0
            });
          }
        }, {
          shown: function (evt, el) {
            note.menu.whenModalShow();
            $(el).find('.borderinfo').removeClass('borderinfo').css({
              border: 'none'
            });
          },
          hidden: function () {
            note.menu.whenModalHide();
          }
        });
      };

      if (nid) {
        var pg = lemon.homeProgress();
        note.entity.get(nid, function (n) {
          ashow(n);
          pg.end();
        });
      } else {
        var cn = current();
        delete cn.language;
        ashow(note.make(cn));
      }
    },
    login: function () {
      note.entity.loginView = note.views(lemon.fullUrl('/user/signin'), function () {
        note.menu.render.tags();
        note.menu.render.note();
      });
    },
    openFile: function () {
      $('#note_open_file').click();
    },


    editMode: function () {
      note.instance.vim.editMode();
    },
    visualMode: function () {
      note.instance.vim.visualMode();
    },
    wrapword: function () {
      note.instance.wordwrap();
    },

    richNote: function () {
      var cMode = note.instance.mode();
      if ('HTML' === cMode.name.toUpperCase()) {
        note.richInst = note.views(lemon.fullUrl('/rich'), false, true, function (view, previewM) {
          view.tellEvent('RICH_NOTE', {
            richData: {
              type: 1,
              val: note.instance.val()
            }
          });
        });
      } else {
        note.instance.tip('Current note is not html language.');
      }
    },
    compareNote: function () {
      note.compareInst = note.views(lemon.fullUrl('/merge'), false, true, function (view, previewM) {
        var cMode = note.instance.mode();
        view.tellEvent('COMPARE_NOTE', {
          mergeData: {
            info: {
              theme: note.instance.theme(),
              mime: cMode.chosenMimeOrExt || cMode.mime
            },
            vals: {
              right: note.instance.val()
            },
            merge: {
              allowEditingOriginals: false
            }
          }
        });
      });
    },

    helps: {
      vim: {
        link: 'http://vimdoc.sourceforge.net/htmldoc/'
      },
      vimcn: {
        link: 'http://vimcdoc.sourceforge.net/doc/help.html'
      },
      vimcmd: {
        link: 'https://jronrun.github.io/refs/img/vim_cheat_sheet_for_programmers_screen.png'
      },
      vimcmds: {
        link: 'http://michael.peopleofhonoronly.com/vim/'
      },
      vimcm: {
        link: lemon.fullUrl('/components/codemirror/keymap/vim.js')
      },
      note: {
        link: function () {
          return mirror.defineEx();
        }
      }
    }
  },

  entity: {
    fail: function (resp) {
      if (401 == resp.code) {
        note.action.login();
      } else {
        note.instance.tip(resp.msg);
      }
    },
    tag: function (nid, tagId, tags, succCall, failCall) {
      lemon.put('/note/entity/' + nid, {
        tags: tags,
        data: lemon.enc({
          tags: [tagId]
        })
      }).done(function(resp) {
        if (0 == resp.code) {
          current(note.make(lemon.deepDec(resp.result)));
          lemon.isFunc(succCall) && succCall(resp);
        } else {
          note.entity.fail(resp);
          lemon.isFunc(failCall) && failCall(resp);
        }
      });
    },
    save: function (aNote, succCall, failCall) {
      aNote = note.make(aNote);
      var respCall = function (resp) {
        if (0 == resp.code) {
          current(note.make(lemon.deepDec(resp.result)));
          note.menu.render.note(true);
          note.instance.tip('Save ' + aNote.title + ' success');
          lemon.isFunc(succCall) && succCall(resp);
        } else {
          note.entity.fail(resp);
          lemon.isFunc(failCall) && failCall(resp);
        }
      };

      if (aNote._id) {
        lemon.put('/note/entity/' + aNote._id, {
          data: lemon.enc(aNote)
        }).done(function(resp) {
          respCall(resp);
        });
      } else {
        $.post('/note/create', {
          data: lemon.enc(aNote)
        }).done(function (resp) {
          respCall(resp);
        });
      }
    },
    //opt 1 add, 2 rem
    tagQry: function (tagId, opt, callback) {
      opt = opt || 1;
      var qry = note.entity.list, doTriList = false;
      qry.prevTags = qry.prevTags || [];
      switch (opt) {
        case 1:
          if (qry.prevTags.indexOf(tagId) == -1) {
            qry.prevTags.push(tagId);
            doTriList = true;
          }
          break;
        case 2:
          doTriList = true;
          lemon.rmByVal(qry.prevTags, tagId);
          break;
      }

      if (doTriList) {
        note.entity.triList(function () {
          lemon.isFunc(callback) && callback();
        }, true);
      }
    },
    triList: function (callback, tagQry) {
      var btnQry = '#note_qry', qryK = $(btnQry).val(), cards = '#note_entities',
        qry = note.entity.list, keyTag = (qry.prevTags || []).join(',');
      if (qryK != qry.prevKey || tagQry) {
        $(cards).empty();
        var pg = lemon.homeProgress();
        note.entity.list(qryK, 1, keyTag, function() {
          lemon.isFunc(callback) && callback();
          pg.end();
        });
        qry.noteEnd = false;
        qry.prevKey = qryK;
      }
    },
    list: function (key, page, keyTag, callback) {
      page = page || 1;
      var btnQry = '#note_qry', ddBody = '#menu_dd_note_dd', cards = '#note_entities', qry = note.entity.list;
      $(ddBody).data('page', page);

      var fp = false;
      if (fp = (1 == page) && !$(btnQry).length) {
        $(ddBody).append(lemon.tmpl($('#menu_note_tmpl').html(), {
        }));

        lemon.enter(btnQry, function () {
          note.entity.triList();
        });
      }

      var data = {
        page: page,
        key: key,
        tag: keyTag
      };

      $.post('/note/entities', data, function (resp) {
        if (0 == resp.code) {
          var rdata = lemon.deepDec(resp.result);
          if (rdata.items.length > 0) {

            lemon.each(rdata.items, function (n, idx) {
              $(cards).append(note.menu.render.card({
                n: n,
                userl: (1 == rdata.userl ? true : false),
                btns: 1
              }));
            });

            if (qry.prevKey && qry.prevKey.length > 0) {
              lemon.blast(qry.prevKey, cards);
            }
          }

          if (!rdata.hasNext) {
            qry.noteEnd = true;
          }

          if (fp) {
            note.entity.listScroll();
          }

          if (lemon.isSmallDownView()) {
            var nptrid = '#next-page-tri';
            if (rdata.hasNext) {
              $(nptrid).show();
            } else {
              $(nptrid).hide();
            }
          }

        } else {
          note.instance.tip(resp.msg);
        }

        lemon.isFunc(callback) && callback();
      });
    },
    listScroll: function () {
      var ddBody = '#menu_dd_note_dd', nextPage = function (callback) {
        if (!note.entity.list.noteEnd) {
          var pg = lemon.homeProgress(), pn = parseInt($(ddBody).data('page')) + 1,
            keyTag = (note.entity.list.prevTags || []).join(',');
          note.entity.list(note.entity.list.prevKey, pn, keyTag, function() {
            pg.end(); callback();
          });
        }
      };

      if (lemon.isMediumUpView()) {
        if (!lemon.isEvented(ddBody)) {
          lemon.scroll(ddBody, function () {
            nextPage();
          });

          lemon.setEvented(ddBody);
        }
      } else {
        var npid = '#next-page', nptrid = '#next-page-tri';
        if ($(npid).length) {
          if (!$(nptrid).length) {
            var aBtn = [
              '<button type="button" class="btn btn-info btn-lg btn-block" id="next-page-tri">',
              'More...',
              '</button>'
            ].join('');
            $(npid).append(aBtn);
            $(nptrid).click(function () {
              var pg = lemon.progress(nptrid);
              nextPage(function () {
                pg.end();
              });
            });
          }
        }
      }
    },
    loadById: function (noteId, callback) {
      note.entity.get(noteId, function (rNote) {
        current(note.make());
        note.load(rNote);
        lemon.isFunc(callback) && callback();
      });
    },
    get: function (noteId, callback) {
      if (lemon.isBlank(noteId)) {
        return note.instance.tip('Unknown note id');
      }

      $.get('/note/entity/' + noteId).done(function (resp) {
        if (0 == resp.code) {
          var rNote = note.make(lemon.deepDec(resp.result));
          lemon.isFunc(callback) && callback(rNote);
        } else {
          note.entity.fail(resp);
        }
      });
    },
    del: function (noteId, callback) {
      lemon.delete('/note/entity/' + noteId).done(function(resp) {
        if (0 == resp.code) {
          lemon.isFunc(callback) && callback();
        } else {
          note.entity.fail(resp);
        }
      });
    }
  },

  make: function (aNote) {
    var isNew = lemon.isBlank(aNote), rNote = lemon.extend({
      _id: '',
      tags: [],
      note: '',
      title: '',
      content: '',
      summary: '',
      language: ''
    }, aNote || {});

    var curN = current(); if (!isNew) {
      if (!rNote._id) {
        rNote._id = curN._id || '';
      }
      //note allow empty
      if (!lemon.has(aNote, 'note')) {
        if (!rNote.note) {
          rNote.note = curN.note || '';
        }
      }
      if (!rNote.tags) {
        rNote.tags = curN.tags || [];
      }

      if (!rNote.content) {
        rNote.content = note.instance.val();
      }

      if (!rNote.language) {
        var lang = note.instance.mode();
        rNote.language = {
          name: lang.name,
          mime: lang.mime
        };
      }

      if (!rNote.title) {
        if (curN.title) {
          rNote.title = curN.title;
        } else {
          var line1 = note.instance.target.getLine(0);
          if (line1.length > 1) {
            rNote.title = line1.substr(0, title_len);
          } else {
            rNote.title = 'Note.' + lemon.when.tiny();
          }
        }
      }
      if (!rNote.summary) {
        if (curN.summary) {
          rNote.summary = curN.summary;
        } else {
          rNote.summary = rNote.content.substr(0, 100);
        }
      }

    }

    return rNote;
  },
  load: function (aNote) {
    note.instance.mode(aNote.language.name || 'text', aNote.language.mime || undefined);
    note.instance.val(aNote.content);
    current(aNote);
  },

  views: function (text, hiddenCall, noneWrapJSON, domReadyCall) {
    var jsonOptions = false;
    if (!noneWrapJSON) {
      if (mirror.mirrors.isJson(text, true)) {
        text = lemon.fmtjson(text);
        jsonOptions = {
          mirror: mirror.mirrors,
          isDecode: true
        };
      }
    }

    //lemon.preview(text, callback, jsonOptions, domReadyCallbackIfUrl, modalOptions, modalEvents)
    return lemon.preview(text, function () {
      note.menu.whenModalShow();
    }, jsonOptions, domReadyCall, false, {
      hidden: function () {
        note.menu.whenModalHide();
        lemon.isFunc(hiddenCall) && hiddenCall();
      }
    });
  },
  lang: {
    tip: function (rMode) {
      var modeInfo = ['Current Language'];
      if (!lemon.isBlank(rMode.name)) {
        modeInfo.push(rMode.name);
      }
      if (!lemon.isBlank(rMode.mime)) {
        modeInfo.push(rMode.mime);
      }
      // if (!lemon.isBlank(rMode.mode)) {
      //   modeInfo.push(rMode.mode);
      // }

      note.instance.tip(modeInfo.join(' '))
    },

    change: function (aLang, langInfo) {
      try {
        note.lang.tip(note.instance.mode(aLang, langInfo || ''));
      } catch (e) {
        note.action.menuShow();
        lemon.dropdownTgl('#menu_dd_mode_dd');
      }
    }
  },
  theme: {
    tip: function (th) {
      note.instance.tip('Current Theme ' + th);
    },

    change: function (aTheme) {
      try {
        note.theme.tip(note.instance.theme(aTheme));
      } catch (e) {
        note.action.menuShow();
        lemon.dropdownTgl('#menu_dd_theme_dd');
      }
    }
  },

  menu: {
    id: '#note_tool',
    triId: '#note-tool-tri',
    instance: null,

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

    visualCmds: function () {
      var na = function (action, args, cm) {
        var menuHandle = null;
        if (lemon.isFunc(menuHandle = note.action[action])) {
          menuHandle(args, cm);
        } else if (lemon.isFunc(menuHandle = note.instance[action])) {
          menuHandle();
        }
      }, ex = mirror.defineEx;

      ex('rich', function (args, cm) { na('richNote', args, cm); }, 'Rich Note (WYSIWYG)');
      ex('compare', function (args, cm) { na('compareNote', args, cm); }, 'Compare Note, Merge & Diff', 'comp');
      ex('foldall', function (args, cm) { na('foldAll', args, cm); }, 'Fold All', 'folda');
      ex('unfoldall', function (args, cm) { na('unfoldAll', args, cm); }, 'Unfold All', 'unfolda');

      ex('login', function (args, cm) { na('login', args, cm); }, 'Sign In');
      ex('info', function (args, cm) { na('noteInfo', args, cm); }, 'Note Info');
      ex('joinline', function (args, cm) { na('joinline', args, cm); }, 'Join Line', 'jo');
      ex('mode', function (args, cm) { na('mode', args, cm); }, 'Language', 'm');
      ex('theme', function (args, cm) { na('theme', args, cm); }, 'Theme', 'th');
      ex('help', function (args, cm) { na('help', args, cm); }, 'Help', 'h');
      ex('del', function (args, cm) { na('delNote', args, cm); }, 'Delete Note', 'd');
      ex('edit', function (args, cm) { na('editNote', args, cm); }, 'Edit Note', 'e');
      ex('new', function (args, cm) { na('newNote', args, cm); }, 'New Note', 'n');
      ex('open', function (args, cm) { na('openFile', args, cm); }, 'Open File', 'o');
      ex('menu', function (args, cm) { na('menuTgl', args, cm); }, 'Toggle Menu');
      ex('q', function (args, cm) { na('closeNote', args, cm); }, 'Close Note');
      ex('shared', function (args, cm) { na('sharedNote', args, cm); }, 'Share Note Direct');
      ex('share', function (args, cm) { na('shareNote', args, cm); }, 'Share Note with Preview');
      ex('view', function (args, cm) { na('preview', args, cm); }, 'Preview', 'v');
      ex('fullscreen', function (args, cm) { na('fullscreenTgl', args, cm); }, 'Toggle Fullscreen', 'full');

      //CodeMirror.commands.save = note.action.saveNote;
      ex('w', function (args, cm) { na('saveNote', args, cm); }, 'Save Note');
      ex('ww', function (args, cm) { na('saveNoteCust', args, cm); }, 'Save Note With Custom...');
      ex('asnew', function (args, cm) { na('curAsNewNote', args, cm); }, 'Current As New Note', 'asn');
      ex('wnew', function (args, cm) { na('saveAndNewNote', args, cm); }, 'Save & New Note', 'wn');
      ex('wq', function (args, cm) { na('saveAndCloseNote', args, cm); }, 'Save & Close Note');
      ex('save', function (args, cm) { na('saveNoteAs', args, cm); }, 'Save Note As...', 'sa');
      ex('wrapword', function (args, cm) { na('wrapword', args, cm); }, 'Word Wrap', 'wrap');
      ex('jump', function (args, cm) { na('jumpToLine', args, cm); }, 'Jump To Line');
    },

    source: function () {
      var help_item = function (name, topic) {
        return note.menu.item(name, '', '', name, 'help', { topic: topic });
      }, tgl_item = function(name, desc, title, action, params) {
        return note.menu.item(name, '<em class="fa fa-toggle-on"></em>', desc, title, action, params);
      };

      return [
        /* { type: 'link', item: note.menu.item('New', false, false, 'New Note (:new)', 'newNote') } */
        {
          type: 'dropdown',
          ddName: 'File',
          id: 'menu_dd_file',
          items: [
            note.menu.item('New', ':n', 'visual & edit', 'New Note (:new)', 'newNote'),
            note.menu.item('Save & New', ':wn', 'visual & edit', 'Save & New Note (:wnew)', 'saveAndNewNote'),
            note.menu.item('As New', ':asn', 'visual & edit', 'Current As New Note (:asnew)', 'curAsNewNote'),
            note.menu.item('Open File...', ':o', 'visual & edit', 'Open File (:open)', 'openFile'),
            note.menu.item('separator'),
            note.menu.item('Close Menu', ':menu', 'visual & edit', 'Close Menu', 'menuTgl'),
            note.menu.item('Close Note', ':q', 'visual & edit', 'Close Note', 'closeNote', false, true),
            note.menu.item('Share Note', ':share', 'visual & edit', 'Share Note', 'shareNote'),
            note.menu.item('Preview', ':v', 'visual & edit', 'Preview (:view)', 'preview'),
            tgl_item('Fullscreen', 'Ctrl-L', 'Toggle Fullscreen (Ctrl-L)', 'fullscreenTgl'),
            note.menu.item('separator'),
            note.menu.item('Note Info', ':info', 'visual & edit', 'Note Info', 'noteInfo'),
            note.menu.item('Save Note', ':w', 'visual & edit', 'Save Note (:w)', 'saveNote'),
            note.menu.item('Save Note With...', ':ww', 'visual & edit', 'Save Note With Custom (:ww)', 'saveNoteCust'),
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
            note.menu.item('Undo', 'u', 'visual & edit', 'Undo (:undo)', 'undo'),
            note.menu.item('Redo', 'Ctrl-R', 'visual & edit', 'Redo (:redo)', 'redo'),
            note.menu.item('separator'),
            note.menu.item('Edit Mode', 'i', 'visual', 'Edit Mode', 'editMode'),
            note.menu.item('Visual Mode', 'Esc', 'edit', 'Visual Mode', 'visualMode'),
            note.menu.item('Rich Mode', ':rich', 'visual & edit', 'Rich Mode (WYSIWYG)', 'richNote'),
            note.menu.item('Compare Mode', ':comp', 'visual & edit', 'Compare Mode', 'compareNote'),
            note.menu.item('separator'),
            note.menu.item('Content Assist', 'Ctrl-J', 'visual & edit', 'Content Assist', 'autocomplete'),
            note.menu.item('Word Wrap', ':wrap', 'visual & edit', 'Word Wrap (:wrapword)', 'wrapword'),
            tgl_item('Toggle Comment', 'Ctrl-/', 'Toggle Comment (Ctrl-/)', 'toggleComment'),
            note.menu.item('Fold All', ':folda', 'visual & edit', 'Fold All (:foldall)', 'foldAll'),
            note.menu.item('Unfold All', ':unfoldall', 'visual & edit', 'Unfold All (:unfolda)', 'unfoldAll'),
            tgl_item('Toggle Fold', 'Ctrl-Q', 'Toggle Fold (Ctrl-Q)', 'toggleFold'),
            note.menu.item('Matching Tag', 'Ctrl-K', 'visual & edit', 'To Matching Tag', 'toMatchingTag'),
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
        { type: 'link', item: note.menu.item('Compare', false, false, 'Compare Note, Merge & Diff', 'compareNote') },
        {
          type: 'dropdown',
          ddName: 'Help',
          id: 'menu_dd_help',
          items: [
            help_item('Vim Doc', 'vim'),
            help_item('Vim Doc cn', 'vimcn'),
            help_item('Vim Cheat Sheet', 'vimcmd'),
            help_item('Vim Cheats', 'vimcmds'),
            help_item('Codemirror Vim', 'vimcm'),
            help_item('Note Vim', 'note')
          ]
        }
      ];
    },

    render: {
      noteEl: function (nid, options) {
        var nidEl = ''; if ($(nidEl = '#n_' + nid).length) {
          var n = lemon.data(nidEl, 'entity'), userl = lemon.data(nidEl, 'userl');
          $(nidEl).replaceWith(note.menu.render.card(lemon.extend({
            n: n,
            userl: userl,
            btns: 1
          }, options || {})));
        }
      },
      card: function (options) {
        return lemon.tmpl($('#note_card_tmpl').html(), lemon.extend({
          n: {},
          cnid: current()._id,
          tags: note.tags,
          userl: false,
          btns: 0
        }, options || {}))
      },
      note: function (force) {
        if (force) {
          $('#note_entities').empty();
        }
        note.entity.list();
        note.entity.list.noteEnd = false;
        note.entity.listScroll();
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
      },
      tags: function () {
        $.post('/note/tag').done(function (resp) {
          if (0 == resp.code) {
            note.tags = lemon.deepDec(resp.result);
            if (!note.tags) {
              note.tags = [];
            }
          } if (401 == resp.code) {

          } else {
            note.instance.tip(resp.msg);
          }
        });
      }
    },

    whenModalShow: function () {
      note.menuOpened = note.menu.instance.opened();
      if (note.menuOpened) {
        note.action.menuHide();
      }
      $(note.menu.triId).hide();
    },
    whenModalHide: function () {
      if (note.menuOpened) {
        note.action.menuShow();
      }
      $(note.menu.triId).show();
    },

    intl: function () {
      lemon.live('click', '#menu_logo', function () {
        note.views(lemon.fullUrl('/manage/notes/1'), function () {
          note.menu.render.tags();
        });
      });
      note.menu.visualCmds();

      note.saveWith = lemon.modal({
        id: 'note_cust_save',
        cache: true,
        body: lemon.tmpl($('#save_body_tmpl').html(), {}),
        footer: lemon.tmpl($('#save_foot_tmpl').html(), {}),
        modal: {
          backdrop: 'static',
          keyboard: false
        }
      }, {
        show: function () {
          note.menu.whenModalShow();
        },
        shown: function(evt, el) {
          var fid = '#save_with_form', swid = '#save_with', aNote = note.make(true);
          lemon.fillParam(fid, aNote);
          if (!lemon.isEvented(swid)) {
            $(swid).click(function () {
              var pg = lemon.progress(fid + ',' + swid);
              note.entity.save(lemon.getParam(fid, 'textarea'), function () {
                pg.end();
                note.saveWith.hide();
              }, function () {
                pg.end();
              });
            });
            lemon.setEvented(swid);
          }
        },
        hidden: function (evt, el) {
          note.menu.whenModalHide();
        }
      });

      lemon.live('click', 'a[data-menuact]', function (evt, el) {
        evt.preventDefault();
        var anEl = 'A' == el.tagName ? el : $(el).parent(),
          act = lemon.data(anEl, 'menuact'), menuHandle = null;

        if (lemon.isFunc(menuHandle = note.action[act])) {
          menuHandle(lemon.data(anEl, 'params'), evt, el);
        } else if (lemon.isFunc(menuHandle = note.instance[act])) {
          menuHandle();
        }
      });

      lemon.live('click', '#menu_dd_note_dd', function (evt) {
        evt.stopPropagation();
      });

      lemon.live('dblclick', 'div[data-entity]', function (evt) {
        var el = evt.currentTarget, n = lemon.data(el, 'entity'), pnid = current()._id;
        if (note.menu.instance.opened()) {
          var pg = lemon.homeProgress();
          note.entity.loadById(n._id, function () {
            if (lemon.isSmallDownView()) {
              note.action.menuHide();
            } else {
              note.menu.render.noteEl(pnid);
              note.menu.render.noteEl(n._id);
            }
            pg.end();
          });
        }
      });

      lemon.live('click', 'button[id^=n_tags_]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'nid');
        lemon.tabShow('#tri-ncard-' + nid + '-tab2');
      });
      lemon.live('click', 'button[id^=n_info_]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'nid');
        lemon.tabShow('#tri-ncard-' + nid + '-tab1');
      });
      lemon.live('click', 'button[id^=n_newtag_]', function (evt) {
        note.views(lemon.fullUrl('/manage/tag'), function () {
          note.menu.render.tags();
        });
      });
      lemon.live('click', 'button[data-add-tag]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'nid'), tag = lemon.data(el, 'addTag');
        if ($(lemon.format('#note_tag_{0}_{1}', nid, tag.id)).length) {
          return;
        }

        var pg = lemon.progress('#' + $(el).attr('id'));
        note.entity.tag(nid, tag.id, 2, function () {
          pg.end();
          lemon.delay(function () {
            var nidEl = '#n_' + nid, n = lemon.data(nidEl, 'entity');
            n.tags.push(tag.id);
            lemon.data(nidEl, { entity: n});

            lemon.tmpls('#note_tag_tmpl', {nid: nid, tag: tag}, lemon.format('#note_tags_{0}', nid));
            lemon.tmpls('#rem_tag_tmpl', {nid: nid, tag: tag}, lemon.format('#note_rem_tags_{0}', nid));
          }, 300);
        }, function () { pg.end(); });
      });
      lemon.rightclick('button[data-add-tag]', function (evt) {
        var el = evt.currentTarget, tag = lemon.data(el, 'addTag');
        note.views(lemon.fullUrl('/manage/tag/' + tag._id), function () {
          note.menu.render.tags();
        });
      });
      lemon.live('click', 'button[data-rem-tag]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'nid'),
          tag = lemon.data(el, 'remTag'), remFmt = '#note_tag_{0}_{1},#rem_tag_{0}_{1}',
          pg = lemon.progress('#' + $(el).attr('id'));
        note.entity.tag(nid, tag.id, 3, function () {
          pg.end();
          lemon.delay(function () {
            var nidEl = '#n_' + nid, n = lemon.data(nidEl, 'entity');
            n.tags = lemon.rmByVal(n.tags, tag.id);
            lemon.data(nidEl, { entity: n});

            $(lemon.format(remFmt, nid, tag.id)).remove();
          }, 300);
        }, function () { pg.end(); });
      });

      lemon.live('click', 'button[data-note-tag]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'nid'), tag = lemon.data(el, 'noteTag'),
          qtid = lemon.format('#qry_tag_{0}_{1}', nid, tag.id);
        if (!$(qtid).length && note.menu.instance.opened()) {
          note.entity.tagQry(tag.id, 1, function () {
            lemon.tmpls('#qry_tag_tmpl', {nid: nid, tag: tag}, '#qry_tags');
          });
        }
      });
      lemon.live('click', 'button[data-qry-tag]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'nid'), tag = lemon.data(el, 'qryTag'),
          qtid = lemon.format('#qry_tag_{0}_{1}', nid, tag.id);
        note.entity.tagQry(tag.id, 2, function () {
          $(qtid).remove();
        });
      });

      lemon.live('click', 'button[data-del-note]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'delNote');
        note.action.delNote({
          noteId: nid
        });
      });
      lemon.live('click', 'button[data-share-note]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'shareNote');
        note.action.shareNote({
          noteId: nid
        });
      });
      lemon.rightclick('button[data-share-note]', function (evt) {
        var el = evt.currentTarget, nid = lemon.data(el, 'shareNote'), n = lemon.data('#n_' + nid, 'entity');
        sharing.createAndShow({
          title: n.title,
          type: 4,
          content: n._id
        });
      });

      var themeSel = 'div[data-theme]', langSel = 'div[data-lang]', langInfoSel = 'a[data-lang-info]';
      lemon.rightclick(themeSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget;
        note.theme.change(lemon.data(el, 'theme'));
      });

      lemon.live('click', themeSel, function (evt) {
        var el = evt.currentTarget, th = lemon.data(el, 'theme');
        note.theme.change(th);
        note.menu.render.theme();
      });

      lemon.rightclick(langSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget, lang = lemon.data(el, 'lang');
        note.lang.change(lang.name);
      });

      lemon.live('click', langSel, function (evt) {
        if (note.langInfoSel) {
          note.langInfoSel = false;
          return;
        }
        var el = evt.currentTarget, lang = lemon.data(el, 'lang');
        note.lang.change(lang.name);
        note.menu.render.lang();
      });

      lemon.rightclick(langInfoSel, function (evt) {
        evt.stopPropagation();
        var el = evt.currentTarget, langInfo = lemon.data(el, 'langInfo'),
          lang = note.instance.langInfo(langInfo);
        note.lang.change(lang.name, langInfo);
      });

      lemon.live('click', langInfoSel, function (evt) {
        note.langInfoSel = true;
        var el = evt.currentTarget, langInfo = lemon.data(el, 'langInfo'),
          lang = note.instance.langInfo(langInfo);
        note.lang.change(lang.name, langInfo);
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

      files.read('#note_open_file', function(context, file){
        note.instance.val('');
        note.instance.val(context);
        if (file && file.type) {
          note.instance.mode(file.type, file.type);
        } else {
          note.instance.mode('text', 'text/plain');
        }
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
          lemon.pubEvent('NOTE_MENU', {
            show: 1
          });
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
        },
        hidden: function () {
          lemon.pubEvent('NOTE_MENU', {
            show: 0
          });
        }
      });

      $(note.menu.triId).click(function () {
        note.menu.tgl();
      });

      lemon.rightclick(note.menu.triId, function (evt) {
        var el = evt.currentTarget;
        lemon.pubEvent('BTN_TOGGLE', {
          show: lemon.attrTgl(el, 'btgl') ? 1 : 0
        });
      });
    }
  },

  snapshoot: function (keepNid) {
    var cMode = note.instance.mode(), aNote = lemon.clone(current());
    lemon.extend(aNote, {
      content: lemon.enc(note.instance.val())
    });
    if (!keepNid) {
      delete aNote._id;
    }

    return {
      note: aNote,
      menu: {
        open: note.menu.instance.opened()
      },
      mirror: {
        opts: note.instance.attrs(['foldGutter','lineNumbers','gutters']),
        vimInsert: 'vim-insert' === note.instance.attrs('keyMap'),
        mode: {
          name: cMode.name,
          chosen: cMode.chosenMimeOrExt || cMode.mime
        },
        th: note.instance.theme()
      }
    };
  },
  snapload: function (snapdata) {
    snapdata = snapdata ? lemon.deepDec(snapdata) : lemon.persist('note_snapshoot');
    var n = null, m = null, mn = null;
    if (n = snapdata.note) {
      n.content = lemon.dec(n.content);
      note.load(note.make(n));
    }

    if (nm = snapdata.menu) {
      if (nm.open) {
        note.action.menuShow();
      }
    }

    if (m = snapdata.mirror) {
      note.instance.attrs(m.opts || {});
      if (m.mode) {
        note.lang.change(m.mode.name, m.mode.chosen);
      }
      if (m.th) {
        note.theme.change(m.th);
      }
      if (m.vimInsert) {
        note.action.editMode();
      }
    }
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

    note.menu.render.tags();
    note.instance = mirror(note.id);
    note.menu.intl();
    if (lemon.isSmallDownView()) {
      note.action.editMode();
    }

    var lnid = lemon.data(note.id, 'lnid');
    if (lemon.isBlank(lnid)) {
      if (lemon.isRootWin()) {
        note.snapload();
      }
    } else {
      note.action.editNote({
        noteId: lnid
      });
    }

    lemon.subMsg(function (data) {
      // lemon.info(data, 'Note received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'SIGNIN':
            if (note.entity.loginView) {
              note.entity.loginView.hide();
              note.entity.loginView = false;
            }
            break;
          case 'SIGNOUT':
            location.reload();
            break;
          case 'SNAPSHOOT':
            var shoot = {};
            shoot[data.iframe.name] = {
              id: evtData.id,
              iframe: {
                type: 3,
                isDefault: evtData.isDefault,
                name: evtData.tabName,
                src: data.iframe.src
              },
              snapdata: note.snapshoot()
            };
            lemon.persist('mapi_snapshoot', shoot);
            break;
          case 'LEAVE':
            leave();
            break;
          case 'SNAPLOAD':
            note.snapload(evtData.snapdata);
            break;
          case 'SHARE_NOTE':
            var snapD = lemon.clone(evtData.content);
            delete snapD._id;

            note.snapload({
              note: snapD
            });

            if (1 == evtData.preview) {
              note.shareShow({
                title: evtData.content.title,
                type: 4,
                content: evtData.content._id
              });
            }

            if (1 == evtData.read_write) {
              $(note.menu.triId).remove();
            }
            break;
          case 'SHARE_NOTE_SNAPSHOT':
            var sData = lemon.deepCopy(evtData.content);
            note.snapload(evtData.content);

            if (1 == evtData.preview) {
              note.action.menuHide();
              var sTitle = evtData.content.note.title;
              note.shareShow({
                title: 'Note Snapshot' + (sTitle ? (' of ' + sTitle) : ''),
                type: 5,
                content: sData
              });
            }

            if (1 == evtData.read_write) {
              note.action.menuHide();
              $(note.menu.triId).remove();
            }
            break;
          case 'SAVE_RICH_NOTE':
            note.instance.val(evtData.note.content);
            note.richInst.destroy();
            note.action.saveNoteCust();
            break;
          case 'SAVE_RICH_TO_NOTE':
            note.load(note.make(evtData.note));
            note.theme.change(evtData.th);
            note.action.saveNoteCust();
            break;
          case 'SAVE_COMPARED_NOTE':
            note.instance.val(evtData.note.content);
            note.compareInst.destroy();
            note.action.saveNoteCust();
            break;
          case 'SAVE_MERGED_TO_NOTE':
            note.load(note.make(evtData.note));
            note.theme.change(evtData.th);
            note.action.saveNoteCust();
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

$(function () { note.initialize(); });
