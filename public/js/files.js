/**
 *
 */
var isFileSaverSupported = false, saveAs = function () {
  lemon.warn('this browser unsupported save file, using google chrome instead');
};

try {
  if (isFileSaverSupported = !!new Blob) {
    saveAs = require('file-saver').saveAs;
  }
} catch (e) {/**/}
require('imports?this=>window!filereader/filereader');

var files = {
  getType: function (aFile) {
    if ((aFile = (aFile || {})).type) {
      return aFile.type;
    }

    if (aFile.extra && aFile.extra.extension) {
      return aFile.extra.extension;
    }

    return '';
  },
  saveAs: function(content, filename, options) {
    if (isFileSaverSupported) {
      saveAs(new Blob([content || ''], lemon.extend({
        type: "text/plain;charset=" + document.characterSet
      }, options || {})), filename);
    }
  },
  read: function (selector, callback, options, events) {
    files.reads(selector, lemon.extend({
      loadstart: function (e, file) {
        lemon.info('start reading ' + file.type + ' file ' + file.name);
        lemon.homeProgress();
      },
      progress: function (e, file) {
        var progress = (e.loaded / e.total) * 100;
        lemon.info('reading file ' + file.name + ' ' + progress + '%');
      },
      loadend: function (e, file) {
        lemon.homeProgressEnd();
        lemon.info('end reading file ' + file.name + ', size: ' + e.total);
        lemon.isFunc(callback) && callback(e.target.result, file);
      },
      skip: function (file) {
        lemon.info('skipped reading file ' + JSON.stringify(file));
      },
    }, events || {}), options || {});
  },
  reads: function (selector, events, options) {
    events = lemon.extend({
      // return false if you want to skip this file
      beforestart: function (e, file) { },
      loadstart: function (e, file) { },
      progress: function (e, file) { },
      load: function (e, file) { },
      error: function (e, file) { },
      loadend: function (e, file) { },
      abort: function (e, file) { },
      // Called when a file is skipped.  This happens when:
      //  1) A file doesn't match the accept option
      //  2) false is returned in the beforestart callback
      skip: function (e, file) { },
      groupstart: function (group) { },
      groupend: function (group) { }
    }, events || {});

    options = lemon.extend({
      dragClass: 'drag',
      /*
         A regex string to match the contenttype of a given file. For example: 'image/*' to only accept images.
         on.skip will be called when a file does not match the filter.
       */
      accept: false,
      /*
         A collection taking key as a string that will be matched with regex against
         file types and the type to read as.  If no match is found, it will use readAsDefault. The default map is:
         {
           'data/*': 'ArrayBuffer',
           'image/*': 'DataURL',
           'text/*' : 'Text'
         }
       */
      readAsMap: { },
      readAsDefault: 'Text',
      on: events
    }, options || {});

    FileReaderJS.setupInput($(selector)[0], options);
  }
};

module.exports = files;
