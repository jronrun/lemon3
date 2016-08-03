/**
 *
 */
var mirror = require('../js/codemirror');

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
        case 3: shar.his.render(ans.result); break;
      }
    } else {
      lemon.warn(ans.msg);
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
      var html = (lemon.tmpl($('#share_his_tmpl').html(), {
        share: share,
        highlight: function(target, tip, css, attrs) {
          return lemon.getHighlightDoc(mirror, lemon.fmtjson(target), tip, css, true, attrs);
        },
        button: shar.his.button
      }));

      $(shar.id).html(html);

      lemon.live('click', lemon.format('#share_his_requ_tgl_{0}', share.content.id), function(evt) {
        shar.his.tglComment(share, evt.originalEvent.target);
      });
    }
  }
};

$(function () { shar.initialize(); });
