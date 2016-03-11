'use strict';

var glob = require('glob');
var path = require('path');

function loadTasks(gulp, plugins, config) {
  var taskNames = [];

  // Load all tasks from tasks folder
  glob.sync(path.resolve(__dirname, './tasks/*.js')).forEach(function(filePath) {
    var taskName = path.basename(filePath, '.js');
    taskNames.push(taskName);

    var task = require(filePath).task;
    var deps = require(filePath).deps || [];

    gulp.task(taskName, deps, function(callback) {
      task(gulp, plugins, config, callback)
    });
  });

  return taskNames;
}


module.exports.loadTasks = loadTasks;
