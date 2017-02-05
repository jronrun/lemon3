/**
 *
 */
var gl = require('../js/golden');

function leave() {
  eye.noteEvt('LEAVE');
}

var eye = {
  instance: null,

  layout: {
    intl: function () {
      eye.instance = gl({
        content: [{
          type: 'row',
          content: [
            gl.kits('eyesv', {
              id: 'eyes_note',
              src: lemon.fullUrl('/note')
            }),
            gl.kits('eyesv', {
              id: 'eyes_preview',
              src: lemon.fullUrl('/show')
            })
          ]
        }]
      }).register( 'eyesv', function(container, state){
        container.on('resize', function(){
          container.lframe.attr({
            height: container.height,
            width: container.width
          });
        });

        var eType = lemon.ltrim(state.id, 'eyes_');
        container.lframe = lemon.iframe({
          id: state.id, name: state.id,
          frameborder: 0,
          src: state.src
        }, container.getElement());

        eye[eType] = container;
      }).init(function () {
        lemon.delay(function () {
          eye.noteEvt('SNAPLOAD');
        }, 800);
      }).contentStyle({
        border: 'none'
      });
    }
  },

  noteEvt: function (evtN, evtData, ackCallback) {
    if (eye.note && eye.note.lframe) {
      eye.note.lframe.tellEvent(evtN, evtData, ackCallback);
    }
  },

  initialize: function() {
    lemon.homeProgress();
    if (lemon.isMediumUpView()) {
      lemon.console();
    }

    eye.layout.intl();
    lemon.subMsg(function (data) {
      // lemon.info(data, 'Eye received msg');
      if (data && data.event) {
        var evtData = data.data;
        switch (data.event) {
          case 'FILL_CONTENT':
            break;
        }
      }
    });

    lemon.unload(function () {
      leave();
    });

    lemon.delay(function () {
      lemon.homeProgressEnd();
    }, 900);
  }
};

$(function () { eye.initialize(); });

//TODO rem
global.eye=eye;
global.gl=gl;
global.$=$;
