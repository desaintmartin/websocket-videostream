// XXX MSE does not allow to know the latest available playback time.
// It means that if video has some delay (due to temporary CPU high usage?), we can't
// go ahead to the latest frame.

const WSStream = require('../wsstream');

const video = document.getElementById('vid');
var websocketVideoStream = null;
var mediaSource = new MediaSource();
var sourceBuffer = null;
var queue = [];
var initialized = false;

function decodeAndPlayWithVideo(mimeCodec) {
  video.src = window.URL.createObjectURL(mediaSource);
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

  mediaSource.addEventListener('sourceopen', function() {
    sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
    sourceBuffer.addEventListener('updateend', onSourceBufferUpdateEnd, false);
    document.body.addEventListener('touchstart', startWebsocket);
    document.body.addEventListener('click', startWebsocket);
  });
}

function startWebsocket() {
  if (initialized) {
    return;
  }
  initialized = true;
  websocketVideoStream = new WSStream('ws://' + location.hostname);
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

module.exports = decodeAndPlayWithVideo;

