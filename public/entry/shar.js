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
      }
    } else {
      lemon.warn(ans.msg);
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

          lemon.homeProgress();
          $.post('/api/comment', { params: data }).done(function (resp) {
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

            lemon.homeProgressEnd();
          });
        }

      } else {
        $(hisRequId).fadeIn();
        $(hisRequDocId).hide();
      }
    },
    render: function(share) {
      if (2 == share.read_write) {
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
