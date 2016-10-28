var http = require('http');
var websocket = require('websocket-stream');
var spawn = require('child_process').spawn;
var server = null

var ffmpeg_bin='/usr/bin/ffmpeg';
var ffmpeg_args = [
        '-re',
        //'-i','http://live.francetv.fr/simulcast/France_Info/hls/index.m3u8',
        '-i', 'http://live.francetv.fr/simulcast/France_Info/hls/France_Info-video=553600.m3u8',
        //'-i', 'rtmp://127.0.0.1:1935/live/latency', // srs
        //'-codec:v','libx264',
        //'-profile:v','baseline',
        //'-level','3',
        //'-codec:v','libvpx',
        //'-g','1',
        '-an',
        '-codec:v','mjpeg', // don't know why I can't make it work again with webm or mp4... most probably an issue with initialisation segment...
        '-b:v','1000k',
        //'-vcodec', 'copy',
        //'-reset_timestamps', '1',
        //'-vsync', '1',
        //'-movflags', 'frag_keyframe',
        //'-flags', 'global_header',
        //'-bsf:v', 'dump_extra',
        //'-vf', "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\\:%T}': fontcolor=white@0.8: x=7: y=7",
        '-bufsize', '500k',
        '-maxrate', '2000k',
        //'-f', 'mp4',
        '-f', 'avi',
        '-'              // Output on stdout
  ];

//var mp4Headers = [];

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
  //ffmpeg.stdout.on('data', function(data) {
  //    if (mp4Headers.length < 3) {
  //          mp4Headers.push(data);
  //    }
  //});
  ffmpeg.on("exit", function (code) {
      console.log("FFMPEG terminated with code " + code);
      process.exit(1);
  });
  ffmpeg.on("error", function (e) {
      console.log("FFMPEG system error: " + e);
      process.exit(1);
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
    // Re-send buffered mp4 packets
    //for (var i = 0; i < mp4Headers.length; i++) {
    //  stream.write(mp4Headers[i]);
    //}
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

