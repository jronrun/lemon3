'use strict';

var tree = function(selector, src, options) {
  $.post(src || '/manage/resource', function (data) {
    $(selector).html(data);
  });
};

module.exports.sourcetree = tree;

