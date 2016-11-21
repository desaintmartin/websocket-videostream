const http = require('http');
const websocket = require('websocket-stream');

const ffmpeg = require('./ffmpeg-handler');


module.exports.start = function(config, callback) {
  var globalFfmpegProcess = null;
  for (var arg in ['app', 'server', 'videoType']) {
    if (config[arg] === null) {
      throw new Exception(arg + ' not specified in configuration.');
    }
  }
  if (config.videoType === 'mjpeg') {
    // mp4 needs headers in beginning of file, thus
    // one globa ffmpeg process for all clients does not work.
    // Only works with mjpeg
    globalFfmpegProcess = ffmpeg(config.videoType, true);
	globalFfmpegProcess.on('exit', function(code) {
      process.exit(1);
    });
    globalFfmpegProcess.on('error', function(e) {
      process.exit(1);
    });
  }

  function sendVideo(stream) {
    if (globalFfmpegProcess !== null) {
      globalFfmpegProcess.stdout.pipe(stream);
      stream.on('finish', function() {
        globalFfmpegProcess.stdout.unpipe(stream);
      });
    } else {
      var ffmpegProcess = ffmpeg(config.videoType);
      ffmpegProcess.stdout.pipe(stream);
      stream.on('finish', function() {
        ffmpegProcess.kill();
      });
    }
  }

  // Send video data through websocket
  var opts = {
    binary: true,
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

