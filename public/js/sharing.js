/**
 *
 */

//require('imports?$=jquery!jquery-qrcode');

var sharing = function(aShare) {
  var headBtns = [], footBtns = [], desc = '';
  if (!aShare.readonly) {
    headBtns.push({
      icon: 'pencil-square',
      onClick: function () {
        lemon.preview(lemon.fullUrl('/manage/share/' + aShare.edit));
      }
    });
  }

  if (aShare.original) {
    desc = 'This is a sharing of already exists.';
    footBtns.push({
      text: 'Create New',
      onClick: function(target) {
        target.shareM.hide();
        sharing.createAndShow(lemon.extend(aShare.original, {
          check: 0
        }));
      }
    });
  }

  sharing.shows({
    link: aShare.link,
    qrclink: aShare.qrcLink,
    desc: desc,
    headBtns: headBtns,
    footBtns: footBtns
  });
};

function links(target) {
  if (!target || target.length < 1) {
    return '';
  }
  return lemon.isUrl(target) ? target : lemon.fullUrl(target);
}

function btnsIntl(buttons) {
  var btns = []; lemon.each(buttons, function (btn) {
    btn = lemon.extend({
      id: '',
      title: '',
      icon: '',
      text: '',
      onClick: false
    }, btn);

    if (!btn.id) {
      btn.id = 'share_btn_' + lemon.uniqueId()
    }

    btns.push(btn);
  });

  return btns;
}

function btnsTrigger(buttons, shareM, el, textId) {
  lemon.each(buttons, function (btn) {
    var bid = '#' + btn.id; $(bid).click(function () {
      lemon.isFunc(btn.onClick) && btn.onClick({
        id: bid,
        shareM: shareM,
        el: el,
        textId: textId
      });
    });
  });
}

sharing.shows = function(options) {
  var layout = '#sharing-layout', textId = '#sharing_view_url', btn_qrcode = '#sharing_qrcode',
    t1 = '#tab-tri-sharing-tab1', t2 = '#tab-tri-sharing-tab2', qrcodeId = '#sharing_qrcode_img';
  options = lemon.extend({
    title: 'Share',
    link: '',          //url || text
    qrclink: '',       //url || text, QRCode will not change with the input if provide
    headBtns: [ /* { icon: '', text: '', onClick: false } */ ],
    footBtns: [ /* { icon: '', text: '', onClick: false } */ ],
    tab: 1,     //1 text tab, 2 QRCode tab
    isURL: true,
    desc: false,       //text or function
    onShown: false,
    clipboard: true    //head add clipboard button
  }, options || {});

  if (options.isURL) {
    options.link = links(options.link);
    options.qrclink = links(options.qrclink);
  }

  var viewport = lemon.viewport(), hasQrclink = !lemon.isBlank(options.qrclink);

  if (true === options.clipboard) {
    options.headBtns.push({
      id: 'sharing_clip',
      icon: 'clipboard'
    });
  }

  options.headBtns = btnsIntl(options.headBtns);
  options.footBtns = btnsIntl(options.footBtns);

  var shareM = lemon.modal({
    title: lemon.tmpl($('#sharing_title_tmpl').html(), options),
    modal: {
      show: true
    },
    body: function() {
      return lemon.tmpl($('#sharing_tmpl').html(), options);
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

      lemon.focusSelectAll(textId);
      $(textId).css({
        width: $(layout).width() * 0.93
      });

      lemon.qrcode(qrcodeId, hasQrclink ? options.qrclink : options.link);
      $(btn_qrcode).click(function () {
        if (lemon.buttonTgl(this)) {
          if (!hasQrclink) {
            lemon.qrcode(qrcodeId, $(textId).val());
          }
          lemon.tabShow(t2);
        } else {
          lemon.tabShow(t1);
        }
      });

      if (2 == options.tab) {
        lemon.buttonTgl(btn_qrcode, 2);
      }

      btnsTrigger(options.headBtns, shareM, el, textId);
      btnsTrigger(options.footBtns, shareM, el, textId);

      if (true === options.clipboard) {
        var clipId = '#sharing_clip';
        lemon.clipboard(clipId, function () {
          return $(textId).val();
        }, function () {
          lemon.inlineTip(clipId, 'Copied!');
        });
      }

      lemon.isFunc(options.onShown) && options.onShown(shareM, el, textId);
      $(el).slideDown();
    }
  });
};

sharing.create = function(share, callback, selector) {
  var pg = null;
  try {
    pg = lemon.progress(selector || '#share_this');
  } catch (e) {/**/}
  share = lemon.extend({
    title: '',
    type: 0,
    content: ''
  }, share || {});

  $.post('/share', {
    data: lemon.enc(share)
  }).done(function (resp) {
    if (0 == resp.code) {
      lemon.isFunc(callback) && callback(resp.result);
    } else {
      lemon.warn(resp.msg);
    }
    pg && pg.end();
  });
};

sharing.createAndShow = function(share, selector) {
  sharing.create(share, function (data) {
    sharing(data);
  }, selector);
};

module.exports = sharing;
