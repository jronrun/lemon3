/**
 *
 */
var mirror = require('../js/codemirror'),
  sharing =  require('../js/sharing');

var shar = {
  id: '#share',

  initialize: function() {
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    shar.render();
  },

  render: function() {
    var ans = lemon.data(shar.id, 'ans');
    if (0 == ans.code) {
      ans.result.content = lemon.deepDec(ans.result.content);
      switch (ans.result.type) {
        case 1: shar.api.render(ans.result); break;
        case 2: shar.api.snapshotRender(ans.result); break;
        case 3: shar.his.render(ans.result); break;
        case 4: shar.note.render(ans.result); break;
        case 5: shar.note.snapshotRender(ans.result); break;
        case 7: shar.api.apisSnapshotRender(ans.result); break;
      }
    } else {
      lemon.warn(ans.msg);
    }
  },

  note: {
    render: function (share) {
      if (shar.note.detectRW(share, 4)) {
        lemon.previews(lemon.fullUrl('/note'), false, false, function (view) {
          view.tellEvent('SHARE_NOTE', share);
        });
      }
    },

    snapshotRender: function (share) {
      if (shar.note.detectRW(share, 5)) {
        lemon.previews(lemon.fullUrl('/note'), false, false, function(view) {
          view.tellEvent('SHARE_NOTE_SNAPSHOT', share);
        });
      }
    },

    detectRW: function (share, sType) {
      if (1 == share.preview) {
        return true;
      }

      if (1 == share.read_write) {
        var content = '', lang = '', theme = 'default';
        if (4 == sType) {
          content = share.content.content;
          lang = share.content.language.mime;
        } else if (5 == sType) {
          content = share.content.note.content;
          lang = share.content.mirror.mode.chosen;
          theme = share.content.mirror.th;
        }

        var vid = 'note_share_view', bid = 'n_preview', rightTip = [
          '<button type="button" id="' + bid + '" class="btn btn-secondary-outline icondh" style="border:0">',
          '<em class="fa fa-eye" title="Show Request URL"></em>',
          '</button>'
        ].join('');

        $(shar.id).css({
          padding: 0
        }).html('<div id="' + vid + '"></div>');

        content = lemon.dec(content);
        mirror.highlights({
          input: content,
          mode: lang,
          theme: theme,
          outputEl: '#' + vid,
          rightTip: rightTip,
          doneHandle: function () {
            $('#' + bid).click(function () {
              lemon.preview(content);
            }).attr('title', 'Left Click To View Plain Text, Right Click To View With Format');
            lemon.rightclick('#' + bid, function () {
              lemon.preview('<pre>' + content + '</pre>');
            });
          }
        });

        return false;
      }

      return true;
    }
  },

  api: {
    render: function(share) {
      lemon.previews(lemon.fullUrl('/api'), false, false, function(view) {
        $('body', view.getDocument()).css({
          'padding-top': '4.15rem'
        });
        view.tellEvent('SHARE_API', share);
      });
    },

    snapshotRender: function(share) {
      lemon.previews(lemon.fullUrl('/api'), false, false, function(view) {
        $('body', view.getDocument()).css({
          'padding-top': '4.15rem'
        });
        view.tellEvent('SHARE_API_SNAPSHOT', share);
      });
    },

    apisSnapshotRender: function(share) {
      lemon.previews(lemon.fullUrl('/apis'), false, false, function(view) {
        view.tellEvent('SHARE_APIs_SNAPSHOT', share);
      });
    }

  },

  his: {
    button: function(tip, id, mark) {
      return lemon.format('<button class="btn btn-sm btn-secondary-outline text-muted" id="{0}" ' +
        'style="border: 0px;" type="button" data-mark="{2}">{1}</button>', id || lemon.uniqueId(), tip, lemon.enc(mark || ''));
    },
    tglComment: function(share, el) {
      var aHis = share.content, hisRequId = '#share_his_requ_' + aHis.id, hisRequDocId = hisRequId + '_doc';

      if ('1' == lemon.data(el, 'mark')) {
        if (lemon.existsEl(hisRequDocId)) {
          $(hisRequId).hide();
          $(hisRequDocId).fadeIn();
        } else {
          var data = {
            serv: aHis.serv.id,
            requ: aHis.api.request,
            api: aHis.api.id
          };

          var pg = lemon.homeProgress();
          $.post('/api/comment', { params: lemon.enc(data) }).done(function (resp) {
            if (0 == resp.code) {
              var rdata = lemon.dec(resp.result);
              if (rdata && rdata.length > 0) {
                var aBtn = shar.his.button('Request with Document', ('share_his_requ_tgl_' + aHis.id));
                var theRequDoc = lemon.getHighlightDoc(mirror, rdata, aBtn, false, true, {
                  id: lemon.ltrim(hisRequDocId, '#')
                });
                $(hisRequId).after(theRequDoc);
                $(hisRequId).hide();
              } else {
                lemon.info('There is none document defined for ' + aHis.api.name);
              }
            }

            pg.end();
          });
        }

      } else {
        $(hisRequId).fadeIn();
        $(hisRequDocId).hide();
      }
    },
    render: function(share) {
      if ([2, 3].indexOf(share.read_write) != -1) {
        lemon.previews(lemon.fullUrl('/api'), false, false, function(view) {
          view.tellEvent('SHARE_HIS', share);
        });
        return;
      }

      var html = (lemon.tmpl($('#share_his_tmpl').html(), {
        share: share,
        highlight: function(target, tip, css, attrs) {
          return lemon.getHighlightDoc(mirror, lemon.fmtjson(target), tip, css, true, attrs);
        },
        button: shar.his.button
      }));

      $(shar.id).html(html);

      var requRightId = lemon.format('#share_his_requ_tgl_{0}', share.content.id);
      lemon.live('click', requRightId, function(evt, el) {
        shar.his.tglComment(share, el);
      });
      $(requRightId).click();

      var shareData = {
        title: 'API History' + (share.content.api.name ? (' of ' + share.content.api.name) : ''),
        type: share.type,
        content: share.content.id
      };

      $('#share_this').click(function () {
        sharing.createAndShow(shareData);
      });

      lemon.rightclick('#share_this', function() {
        sharing.create(shareData, function (data) {
          lemon.preview(lemon.fullUrl('/manage/share/' + data.edit));
        });
      });
    }
  }
};

$(function () { shar.initialize(); });
