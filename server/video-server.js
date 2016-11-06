var http = require('http');
var devnull = require('dev-null');
var websocket = require('websocket-stream');

var ffmpeg = require('./ffmpeg-handler');

var server = null;
var videoType = null;

module.exports.start = function(opts, callback) {
  if (server) {
    callback(new Error('already started'));
    return;
  }

  if (opts.videoType) {
    videoType = opts.videoType;
  }

  if (opts.server) {
    server = opts.server;
  } else {
    server = http.createServer();
    server.listen(80, callback);
    opts.server = server;
  }
  opts.binary = true;

  var ffmpeg_process = ffmpeg(videoType);
  var mp4Headers = [];
  ffmpeg_process.stdout.on('data', function(data) {
      if (mp4Headers.length < 3) {
            mp4Headers.push(data);
      }
  });

  websocket.createServer(opts, video);

  function video(stream) {
    // Re-send buffered mp4 packets
    for (var i = 0; i < mp4Headers.length; i++) {
      stream.write(mp4Headers[i]);
      console.log(mp4Headers[i])
    }
    ffmpeg_process.stdout.pipe(stream);
  }
};

module.exports.stop = function(callback) {
  if (!server) {
    callback(new Error('not started'));
    return;
  }

  server.close(callback);
  server = null;
};

if (!module.parent) {
  module.exports.start(function(err) {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Server started.');
  });
}

