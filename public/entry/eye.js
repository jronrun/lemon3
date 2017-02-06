/**
 *
 */
var gl = require('../js/golden'),
  lastNotifyTime = 0, lastNotifyData = null, lastTell = false
  ;

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
            {
              type: 'column',
              content: [
                gl.kits('eyesv', {
                  id: 'eyes_tool'
                }, false, {
                  height: 0
                }),
                gl.kits('eyesv', {
                  id: 'eyes_preview',
                  src: lemon.fullUrl('/show')
                })
              ]
            }
          ]
        }]
      }).register('eyesv', function(container, state){
        var eType = lemon.ltrim(state.id, 'eyes_'), hasLframe = ['note', 'preview'].indexOf(eType) != -1;
        container.on('resize', function(){
          if (hasLframe) {
            container.lframe.attr({
              height: container.height,
              width: container.width
            });
          }

          if ('tool' === eType) {
            //container.setSize(container.width, 26);
          }
        });

        if (hasLframe) {
          container.lframe = lemon.iframe({
            id: state.id, name: state.id,
            frameborder: 0,
            src: state.src
          }, container.getElement());
        }

        if ('tool' === eType) {
          container.getElement().append('tool');
        }

        eye[eType] = container;
      }).init(function () {
        lemon.delay(function () {
          eye.noteEvt('TOGGLE_NOTIFY', {}, function () {
            eye.noteEvt('SNAPLOAD');
          });
        }, 900);
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

  previewEvt: function (evtN, evtData, ackCallback) {
    if (eye.preview && eye.preview.lframe) {
      eye.preview.lframe.tellEvent(evtN, evtData, ackCallback);
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
          case 'MIRROR_INPUTREAD_NOTIFY':
            lastNotifyData = evtData;
            var curTime = parseInt(lemon.now()), ptell = function () {
              eye.previewEvt('FILL_CONTENT', lastNotifyData);
            };

            if (curTime - lastNotifyTime > 1500) {
              lastNotifyTime = curTime;
              ptell();
            } else {
              if (!lastTell) {
                lastTell = true;
                lemon.delay(function () {
                  ptell();
                  lastTell = false;
                }, 1000);
              }
            }
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
