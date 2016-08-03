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
    render: function(share) {
      var html = (lemon.tmpl($('#share_his_tmpl').html(), {
        share: share,
        highlight: function(target, tip, css, attrs) {
          return lemon.getHighlightDoc(mirror, lemon.fmtjson(target), tip, css, true, attrs);
        }
      }));

      lemon.previews(html);
    }
  }
};

$(function () { shar.initialize(); });
