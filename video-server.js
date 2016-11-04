var http = require('http');
var websocket = require('websocket-stream');
var spawn = require('child_process').spawn;
var devnull = require('dev-null');

var log = require('./logger-server');

var server = null

var ffmpeg_bin='/usr/bin/ffmpeg';
var ffmpeg_args = [
        '-re',
        //'-i','http://live.francetv.fr/simulcast/France_Info/hls/index.m3u8',
        '-i', 'http://live.francetv.fr/simulcast/France_Info/hls/France_Info-video=815200.m3u8',
        //'-i', 'rtmp://127.0.0.1:1935/live/latency', // srs
        //'-f', 'lavfi', '-graph', 'color=c=black [out0]', '-i', 'dummy',
        '-an',
        '-codec:v','libx264',
        '-profile:v','baseline',
        '-level','3.1',
        '-preset', 'superfast',
        '-tune', 'zerolatency',
        '-bufsize', '0',
        '-g','1',
        '-reset_timestamps', '1',
        '-vsync', '1',
        '-movflags', 'frag_keyframe+empty_moov',
        '-flags', 'global_header',
        '-bsf:v', 'dump_extra',
        //'-codec:v','mjpeg',
        //'-b:v','1000k',
        //'-bufsize', '5000k',
        //'-maxrate', '3000k',
        '-vf', "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\\:%T}': fontcolor=white@0.8: x=7: y=7",
        '-avioflags', 'direct',
        '-flush_packets', '1',
        //'-f', 'avi',
        '-f', 'mp4',
        '-y',
        '-' // Output on stdout, https://www.ffmpeg.org/ffmpeg-protocols.html#toc-pipe
  ];

// mp4 needs headers in beginning of file, thus
// one globa ffmpeg process for all clients does not work.
// Only works with mjpeg
var ffmpeg_process = null // ffmpeg();

function ffmpeg() {
  var ffmpeg = spawn(ffmpeg_bin, ffmpeg_args);
  // detect if ffmpeg was not spawned correctly
  ffmpeg.stderr.setEncoding('utf8');
  ffmpeg.stderr.on('data', function(data) {
      log('ffmpeg: '+data);
      if(/^execvp\(\)/.test(data)) {
            console.error('failed to start ' + ffmpeg);
      }
  });
  ffmpeg.on("exit", function (code) {
      console.log("FFMPEG terminated with code " + code);
  });
  ffmpeg.on("error", function (e) {
      console.log("FFMPEG system error: " + e);
  });
  // Pipe to /dev/null so that no buffering of pipe is done when no client is connected
  // Used for mjpeg and one global ffmpeg process
  //ffmpeg.stdout.pipe(devnull());
  return ffmpeg
}

module.exports.start = function(opts, callback) {
  if (server) {
    callback(new Error('already started'));
    return;
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
    ffmpeg_process = ffmpeg();
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

