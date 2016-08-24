/**
 *
 */
var mirror = require('../js/notemirror');

var note = {
  id: '#note_textarea',
  instance: null,

  initialize: function () {
    note.instance = mirror(note.id);

    //TODO remove
    global.note = note;
    global.mirror = mirror;
    //TODO remove


  }
};

$(function () { note.initialize(); });
