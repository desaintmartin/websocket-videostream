const spawn = require('child_process').spawn;
const devnull = require('dev-null');
const log = require('./logger');

var ffmpegBin = '/usr/bin/ffmpeg';
var ffmpegArgsBase = [
  '-re',
  //'-i','http://live.francetv.fr/simulcast/France_Info/hls/index.m3u8',
  '-i', 'http://live.francetv.fr/simulcast/France_Info/hls/France_Info-video=815200.m3u8',
  //'-i', 'http://live.francetv.fr/simulcast/France_Info/hls/France_Info-video=1465200.m3u8',
  //'-i', 'rtmp://127.0.0.1:1935/live/latency', // srs
  //'-f', 'lavfi', '-graph', 'color=c=blue [out0]', '-i', 'dummy',
  '-fflags', '+genpts',
  '-an'
];
var ffmpegArgsMp4 = [
  '-codec:v', 'libx264',
  '-profile:v', 'high',
  '-level', '4.1',
  '-preset', 'superfast',
  '-tune', 'zerolatency',
  '-bufsize', '0',
  '-keyint_min', '5',
  '-g', '5',
  '-movflags', 'frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset',
  '-flags', '+global_header', '-bsf:v', 'dump_extra',
];
var ffmpegArgsWebM = [
  '-codec:v', 'libvpx-vp9',
  '-pass', '0',
  '-cpu-used', '16',
  '-speed', '16',
  '-deadline', 'realtime',
  '-quality', 'realtime',
  '-static-thresh', '0',
  '-max-intra-rate', '300',
  '-lag-in-frames', '0',
  '-error-resilient', '1',
  '-b:v', '5M',
  '-tile-columns', '6', '-frame-parallel', '1', '-threads', '4',
  '-bufsize', '0',
  '-keyint_min', '15',
  '-g', '15',
];
var ffmpegArgsMjpeg = [
  '-codec:v', 'mjpeg',
  '-q:v', '31',
  '-qmax:v', '31',
  '-qmin:v', '31',
  '-pix_fmt', 'yuvj420p',
  '-vsync', 'drop',
];
var ffmpegArgsTrail = [
  '-vf', "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: text='%{localtime\\:%T}': fontcolor=white@0.8: x=7: y=7",
  '-avioflags', 'direct',
  '-flush_packets', '1',
];

var ffmpegGlobalProcess = null; // XXX TODO implement me

function ffmpeg(videoType) {
  if (!videoType) {
    videoType = 'mjpeg';
  }

  var ffmpegArgs = null;
  switch (videoType) {
    case 'mp4':
      ffmpegArgs = ffmpegArgsBase.concat(ffmpegArgsMp4, ffmpegArgsTrail, ['-f', 'mp4', '-y', '-']);
      break;
    case 'mjpeg':
      ffmpegArgs = ffmpegArgsBase.concat(ffmpegArgsMjpeg, ffmpegArgsTrail, ['-f', 'avi', '-y', '-']);
      break;
    case 'webm':
      ffmpegArgs = ffmpegArgsBase.concat(ffmpegArgsWebM, ffmpegArgsTrail, ['-f', 'webm', '-y', '-']);
      break;
    default:
      throw new Error('video type ' + videoType + ' is not supported.');
  }

  log('running ffmpeg:');
  log(ffmpegBin + ' ' + ffmpegArgs.join(' '));
  var ffmpegProcess = spawn(ffmpegBin, ffmpegArgs);
  ffmpegProcess.stderr.setEncoding('utf8');
  ffmpegProcess.stderr.on('data', function(data) {
    log('ffmpeg: ' + data);
    if (/^execvp\(\)/.test(data)) {
      log.error('failed to start ffmpeg');
    }
  });
  ffmpegProcess.on('exit', function(code) {
    log.warn('ffmpeg terminated with code ' + code);
  });
  ffmpegProcess.on('error', function(e) {
    log.warn('ffmpeg system error: ' + e);
  });
  // Pipe to /dev/null so that no buffering of pipe is done when no client is connected
  // Used for mjpeg and one global ffmpeg process
  //ffmpegProcess.stdout.pipe(devnull());
  return ffmpegProcess;
}

module.exports = ffmpeg;
