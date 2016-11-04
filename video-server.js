var http = require('http');
var websocket = require('websocket-stream');

var ffmpeg = require('./ffmpeg-handler');

var server = null;
var videoCodec = null;

// mp4 needs headers in beginning of file, thus
// one globa ffmpeg process for all clients does not work.
// Only works with mjpeg
var ffmpeg_process = null // ffmpeg(videoCodec);

module.exports.start = function(opts, callback) {
  if (server) {
    callback(new Error('already started'));
    return;
  }

  if (opts.videoCodec) {
    videoCodec = opts.videoCodec;
  }

  if (opts.server) {
    server = opts.server;
  } else {
    server = http.createServer();
    server.listen(80, cb)
    opts.server = server;
  }
  opts.binary = true;

  websocket.createServer(opts, video);

  function video(stream) {
    ffmpeg_process = ffmpeg(videoCodec);
    ffmpeg_process.stdout.pipe(stream);
    stream.on('finish', function() {
      ffmpeg_process.kill();
      ffmpeg_process = null;
    });
  }
}

module.exports.stop = function(cb) {
  if (!server) {
    callback(new Error('not started'))
    return
  }

  server.close(cb)
  server = null
}

if (!module.parent) {
  module.exports.start(function(err) {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Echo server started.');
  });
}

