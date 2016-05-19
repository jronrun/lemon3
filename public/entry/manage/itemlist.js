
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

  });
});
