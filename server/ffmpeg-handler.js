var spawn = require('child_process').spawn;
var devnull = require('dev-null');

var log = require('./logger');

var ffmpeg_bin = '/usr/bin/ffmpeg';
var ffmpeg_args_base = [
  '-re',
  //'-i','http://live.francetv.fr/simulcast/France_Info/hls/index.m3u8',
  '-i', 'http://live.francetv.fr/simulcast/France_Info/hls/France_Info-video=815200.m3u8',
  //'-i', 'rtmp://127.0.0.1:1935/live/latency', // srs
  //'-f', 'lavfi', '-graph', 'color=c=black [out0]', '-i', 'dummy',
  '-an'
];
var ffmpeg_args_mp4 = [
  '-codec:v', 'libx264',
  '-profile:v', 'baseline',
  '-level', '3.1',
  '-preset', 'superfast',
  '-tune', 'zerolatency',
  '-bufsize', '0',
  '-g', '1',
  '-reset_timestamps', '1',
  '-vsync', '1',
  '-movflags', 'frag_keyframe+empty_moov',
  '-flags', 'global_header',
  '-bsf:v', 'dump_extra'
];
var ffmpeg_args_mjpeg = [
  '-codec:v', 'mjpeg',
  '-b:v', '1000k',
  '-bufsize', '5000k',
  '-maxrate', '3000k'
];
var ffmpeg_args_trail = [
  '-vf', "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\\:%T}': fontcolor=white@0.8: x=7: y=7",
  '-avioflags', 'direct',
  '-flush_packets', '1'
];

function ffmpeg(videoCodec) {
  if (!videoCodec) {
    videoCodec = 'mjpeg';
  }

  var ffmpeg_args = null;
  if (videoCodec === 'mjpeg') {
    ffmpeg_args = ffmpeg_args_base.concat(ffmpeg_args_mjpeg, ffmpeg_args_trail, ['-f', 'avi', '-y', '-']);
  } else if (videoCodec === 'mp4') {
    ffmpeg_args = ffmpeg_args_base.concat(ffmpeg_args_mp4, ffmpeg_args_trail, ['-f', 'mp4', '-y', '-']);
  } else {
    throw new Error('video codec ' + videoCodec + ' is not supported.');
  }

  var ffmpeg = spawn(ffmpeg_bin, ffmpeg_args);
  ffmpeg.stderr.setEncoding('utf8');
  ffmpeg.stderr.on('data', function(data) {
    log('ffmpeg: ' + data);
    if (/^execvp\(\)/.test(data)) {
      log.error('failed to start ' + ffmpeg);
    }
  });
  ffmpeg.on('exit', function(code) {
    log.warn('ffmpeg terminated with code ' + code);
  });
  ffmpeg.on('error', function(e) {
    log.warn('ffmpeg system error: ' + e);
  });
  // Pipe to /dev/null so that no buffering of pipe is done when no client is connected
  // Used for mjpeg and one global ffmpeg process
  //ffmpeg.stdout.pipe(devnull());
  return ffmpeg;
}

module.exports = ffmpeg;
