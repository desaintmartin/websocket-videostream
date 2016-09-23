var http = require('http');
var websocket = require('websocket-stream');
var spawn = require('child_process').spawn;
var server = null

var port = module.exports.port = 8343;
var url = module.exports.url = 'ws://localhost:' + module.exports.port;

var ffmpeg_bin='/usr/bin/ffmpeg';
var ffmpeg_args = [
        '-re',
        //'-i','http://live.francetv.fr/simulcast/France_Info/hls/index.m3u8',
        '-i', 'http://live.francetv.fr/simulcast/France_Info/hls/France_Info-video=152400.m3u8',
        //'-i', 'rtmp://127.0.0.1:1935/live/ingest', // srs
        //'-codec:v','libx264',
        //'-profile:v','baseline',
        //'-level','3',
        //'-codec:v','libvpx',
        //'-g','1',
        '-an',
        '-codec:v','mjpeg', // don't know why I can't make it work again with webm or mp4... most probably an issue with initialisation segment...
        '-b:v','1000k',
        '-vf', "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\\:%T}': fontcolor=white@0.8: x=7: y=7",
        //'-f', 'webm',
        '-f', 'avi',
        '-'              // Output on stdout
  ];

function ffmpeg() {
  var ffmpeg = spawn(ffmpeg_bin, ffmpeg_args);
  // detect if ffmpeg was not spawned correctly
  ffmpeg.stderr.setEncoding('utf8');
  ffmpeg.stderr.on('data', function(data) {
      console.log('ffmpeg::'+data);
      if(/^execvp\(\)/.test(data)) {
            console.error('failed to start ' + ffmpeg);
            process.exit(1);
      }
  });
  return ffmpeg
}

module.exports.start = function(opts, cb) {
  if (server) {
    cb(new Error('already started'));
    return;
  }

  ffmpeg_process = ffmpeg();

  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  server = http.createServer()
  opts.server = server

  websocket.createServer(opts, video)

  server.listen(port, cb)

  function video(stream) {
    ffmpeg_process.stdout.pipe(stream);
  }
}

module.exports.stop = function(cb) {
  if (!server) {
    cb(new Error('not started'))
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
    console.log('Echo server started on port ' + port);
  });
}
