var XMLHttpRequestPromise = require('xhr-promise');

var jpegExtractor = require('./jpeg-extractor.js');
var WSStream = require('./wsstream.js');

var mimeCodec = null;
var xhrPromise = new XMLHttpRequestPromise();
var websocketVideoStream = null;

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
  websocketVideoStream = new WSStream('ws://' + location.hostname);
  if (!('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec))) {
    console.log('Browser does not support ' + mimeCodec + ' Video codec, falling back to jpeg decoding.');
    decodeAndPlayWithCanvas();
  } else {
    console.log('Browser supports ' + mimeCodec + ' video codec.');
    decodeAndPlayWithVideo();
  }
}

function decodeAndPlayWithCanvas() {
  var mjpegDecoder = new JPEGExtractorStream();
  var canvas = document.getElementById('cid');
  var ctxt = canvas.getContext('2d');
  mjpegDecoder.on('image', function(imgData) {
    var img = null;
    try {
      img = new Image();
    } catch (e) {
      //console.log
    }
    var w, h;
    var uInt8Array = imgData;
    var i = uInt8Array.length;
    var binaryString = [i];
    while (i--) {
      binaryString[i] = String.fromCharCode(uInt8Array[i]);
    }
    var data = binaryString.join('');
    var base64 = window.btoa(data);
    img.src = 'data:image/jpeg;base64,' + base64;
    img.onload = function() {
      w = img.width; h = img.height;
      ctxt.drawImage(img, 0, 0, w, h, 0, 0, ctxt.canvas.width, ctxt.canvas.height);
    };
    img.onerror = function(stuff) {
    };
  });
  websocketVideoStream.ondata = function(_d) {
    mjpegDecoder.write(_d);
  };
  websocketVideoStream.init();
}

function decodeAndPlayWithVideo() {
  // XXX MSE does not allow to know the latest available playback time.
  // It means that if video has some delay (due to temporary CPU high usage?), we can't
  // go ahead to the latest frame.
  var video = document.getElementById('vid');
  var canvas = document.getElementById('cid');
  var mediaSource = new MediaSource();
  var sourceBuffer = null;
  var queue = [];
  var initialized = false;

  video.src = window.URL.createObjectURL(mediaSource);
  video.style.display = 'block';
  canvas.style.display = 'none';
  video.addEventListener('error', function(e) {
    switch (e.target.error.code) {
      case 0:
        msg = 'MEDIA_ERR_ABORTED';
        break;
      case 2:
        msg = 'MEDIA_ERR_NETWORK';
        break;
      case 3:
        msg = 'MEDIA_ERR_DECODE';
        break;
      case 4:
        msg = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
        break;
      case 5:
        msg = 'MEDIA_ERR_ENCRYPTED';
        break;
      default:
        msg = 'UNKNOWN';
        break;
    }
    console.error('Media error: ' + msg);
  });
  video.addEventListener('stalled', function(e) {
    console.warn('Video: stalled');
  });
  video.addEventListener('loadeddata', function(e) {
    console.log('Video: loaded data');
  });
  video.addEventListener('loadedmetadata', function(e) {
    console.log('Video: loaded meatadata');
  });
  video.addEventListener('playing', function(e) {
    console.debug('Video: now loaded and playing');
  });
  video.addEventListener('canplaythrough', function(e) {
    console.debug('Video: can play through');
  });
  video.addEventListener('canplay', function(e) {
    console.debug('Video: can play');
  });

  mediaSource.addEventListener('sourceopen', function() {
    sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
    sourceBuffer.addEventListener('updateend', onSourceBufferUpdateEnd, false);
    document.body.addEventListener('touchstart', startWebsocket);
    document.body.addEventListener('click', startWebsocket);
  });

  function startWebsocket() {
    if (initialized) {
      return;
    }
    initialized = true;
    websocketVideoStream.ondata = onWebsocketData;
    websocketVideoStream.init();
  }

  function onWebsocketData(d) {
    if (queue.length) {
      // If there is any queue, push to queue and don't try to append to buffer
      // In order to respect data order
      queue.push(d);
      return;
    }
    if (sourceBuffer.updating) {
      // If the buffer is busy, push to queue
      queue.push(d);
      return;
    }
    // Default case: directly append to buffer
    sourceBuffer.appendBuffer(d);

    if (video.paused) {
      video.play();
    }
  }

  function onSourceBufferUpdateEnd() {
    // If there is any queue, append it to the buffer before new data arrives
    if (!queue.length || sourceBuffer.updating) {
      // Don't even try if another frame has been pushed by network
      return;
    }
    try {
      // Append the data put in queue
      sourceBuffer.appendBuffer(queue.shift());
    } catch (e) {
      console.error(e);
    }
  }
}

