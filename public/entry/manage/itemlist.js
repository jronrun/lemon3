
$(function () {
  register(function () {

    var $itemActions = $(".item-actions-dropdown");

    $('article').on('click',function(e) {
      if (!$(e.target).closest('.item-actions-dropdown').length) {
        $itemActions.removeClass('active');
      }
    });

    $('.item-actions-toggle-btn').on('click',function(e){
      e.preventDefault();
      var $thisActionList = $(this).closest('.item-actions-dropdown');
      $itemActions.not($thisActionList).removeClass('active');
      $thisActionList.toggleClass('active');
    });

    lemon.onConfirm('item-rem', function (data) {
      lemon.delete(data.href).done(function(resp) {
        if (0 == resp.code) {
          $('#item-' + data.itemId).remove();
          msg.succ('<Strong>' + resp.msg + '</Strong>', '#items-card');
        } else {
          msg.warn(resp.msg, '#items-card');
        }
      });
    });

    var queryStr = $('#items-search').data('query');
    if (queryStr.length > 0) {
      try {
        query = JSON.parse(lemon.dec(queryStr));
        lemon.fillParam('#items-search', query);
      } catch (e) {
        lemon.error('(set)invalid query parameters: ' + e.message);
      }
    }

    $('#item-search-undo').click(function () {
      var data = lemon.getParam('#items-search'), fillData = {};
      lemon.each(data, function (v, k) {
        fillData[k] = '';
      });
      lemon.fillParam('#items-search', fillData);
    });

    var listchoose = '#listchoose-option';
    if ($(listchoose).length) {
      var lcdata = $(listchoose).data();
      var choose = JSON.parse(lemon.dec(lcdata.body));

      lemon.store(choose.base, {
        choose: choose,
        ids: JSON.parse(lemon.dec(lcdata.ids))
      });
    }

    var actionBase = $('#action-base').val(), theChoose = lemon.store(actionBase) || null;
    if (null != theChoose) {
      $('[id^="list-tool-"]').each(function () {
        var id = $(this).attr('id'), itemId = parseInt(id.replace('list-tool-', ''));

        var el = [
          '<p class="text-primary icondh">',
          '<em class="fa {0}" id="listchoose-chk-{1}"></em>',
          '</p>'
        ].join('');

        var clazz = (theChoose.ids || []).indexOf(itemId) == -1 ? 'fa-square-o' : 'fa-check-square-o';
        $(this).prepend(lemon.format(el, clazz, itemId));
      });

      $('[id^="listchoose-chk-"]').click(function() {
        var id = $(this).attr('id'), itemId = parseInt(id.replace('listchoose-chk-', ''));

        var ids = theChoose.ids || [];
        if (lemon.chkboxable('#' + id, 1)) {
          ids.push(itemId);
        } else {
          ids = lemon.rmByVal(ids, itemId);
        }

        theChoose.ids = ids;
        lemon.store(actionBase, theChoose);

        if (1 == theChoose.choose.do) {

        } else if (2 == theChoose.choose.do) {
          $('input[name="id"]').val(ids.join(','));
        }

      });
    }

  });
});
