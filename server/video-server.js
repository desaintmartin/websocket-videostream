const http = require('http');
const net = require('net');
const websocket = require('websocket-stream');

const ffmpeg = require('./ffmpeg-handler');

module.exports.start = function(config, callback) {
  var global_ffmpeg_process = null;
  for (var arg in ['app', 'server', 'videoType']) {
    if (config[arg] === null) {
      throw new Exception(arg + ' not specified in configuration.');
    }
  }
  if (config.videoType === 'mjpeg') {
    // mp4 needs headers in beginning of file, thus
    // one globa ffmpeg process for all clients does not work.
    // Only works with mjpeg
    global_ffmpeg_process = ffmpeg(config.videoType, true);
  }

  function socket2websocket(wsstream) {
    // Run a ffmpeg sending to rtsp
    // Create a listening socket receiving stream
    // Send it through websocket to client
    var ffmpeg_process = ffmpeg(config.videoType);
    var server = net.createServer(function(socket) {
      //socket.pipe(wsstream);
      //wsstream.pipe(socket);
      wsstream.on('finish', function() {
        ffmpeg_process.kill();
        server.close();
      });
    });
    server.listen(4567, '127.0.0.1'); // XXX TODO hardcoded port
  }

  function sendVideo(stream) {
    if (config.videoType === 'rtsp') {
      socket2websocket(stream);
      return;
    }
    if (global_ffmpeg_process !== null) {
      global_ffmpeg_process.stdout.pipe(stream);
      stream.on('finish', function() {
        global_ffmpeg_process.stdout.unpipe(stream);
      });
    } else {
      var ffmpeg_process = ffmpeg(config.videoType);
      ffmpeg_process.stdout.pipe(stream);
      stream.on('finish', function() {
        ffmpeg_process.kill();
      });
    }
  }
  // Send video data through websocket
  var opts = {
    binary: false,//true,
    server: config.server,
  };
  websocket.createServer(opts, sendVideo);
  // Send video data through simple request as well
  config.app.get('/video', function(req, res) {
    if (config.videoType === 'mjpeg') {
      res.setHeader('content-type', 'multipart/x-mixed-replace;boundary=ffserver');
    }
    sendVideo(res);
  });
};

