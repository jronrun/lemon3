/**
 *
 */

var layout = '#sharing-layout',
  copyURL = '#sharing_view_url',
  btn_edit = '#sharing_edit',
  btn_qrcode = '#sharing_qrcode';

module.exports = function(aShare) {
  var viewport = {
    w: $(window).width(),
    h: $(window).height()
  }, sharedLink = (location.origin || '') + aShare.link;

  lemon.modal({
    title: lemon.tmpl($('#sharing_title_tmpl').html(), {}),
    modal: {
      show: true
    },
    body: function() {
      return lemon.tmpl($('#sharing_tmpl').html(), {
        link: sharedLink
      });
    }
  }, {
    show: function() {
      $(el).hide();
    },
    shown: function(event, el) {
      if (lemon.isSmallDownView()) {
        $(el).find('.modal-content').css({
          width: viewport.w * 0.93,
          'max-width': viewport.w * 0.93
        });
      }

      lemon.focusSelectAll(copyURL);
      $(copyURL).css({
        width: $(layout).width() * 0.93
      });

      $(btn_edit).click(function () {
        lemon.preview((location.origin || '') + '/manage/share/' + aShare.edit);
      });

      $(el).slideDown();
    }
  });
};
