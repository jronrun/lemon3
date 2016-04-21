
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

  });
});
