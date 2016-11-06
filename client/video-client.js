var XMLHttpRequestPromise = require('xhr-promise');

var videoDecoder = require('./decoders/video-decoder');
var canvasDecoder = require('./decoders/canvas-decoder');

var mimeCodec = null;
var xhrPromise = new XMLHttpRequestPromise();

xhrPromise.send({
    method: 'GET',
    url: '/getCodec'
  })
  .then(function(results) {
    if (results.status !== 200) {
      throw new Error('request failed');
    }
    mimeCodec = xhrPromise.getXHR().responseText;
    initializeVideo();
  })
  .catch(function(e) {
    console.error(e);
  });

function initializeVideo() {
  var video = document.getElementById('vid');
  var canvas = document.getElementById('cid');
  if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
    console.log('Browser supports ' + mimeCodec + ' video codec.');
    video.style.display = 'block';
    canvas.style.display = 'none';
    videoDecoder(mimeCodec);
  } else if (mimeCodec === 'mjpeg') {
    console.log('Receiving MJPEG, decoding through canvas.');
    canvasDecoder();
  } else {
    throw new Error(mimeCodec + ' not supported, aborting.');
  }
}

