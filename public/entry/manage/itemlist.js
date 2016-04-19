
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

    lemon.onModalShow('item-rem', function (data, modal) {
      //modal.title.html(data.bizid);
    });

  });
});
