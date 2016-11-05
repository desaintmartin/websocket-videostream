const cluster = require('cluster');
const express = require('express');
const http = require('http');
const nocache = require('nocache');
const commandLineArgs = require('command-line-args');

const logger = require('./server/logger');
const videoServer = require('./server/video-server');

const optionDefinitions = [
  { name: 'type', alias: 't', type: String, defaultValue: 'mjpeg' },
  { name: 'port', alias: 'p', type: Number, defaultValue: 80 },
];
const options = commandLineArgs(optionDefinitions);

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
}

if (cluster.isWorker) {
  startWorker();
}

function startWorker() {
  var app = express();
  app.use(express.static(__dirname + '/www/'));
  app.use(nocache());
  app.get('/getCodec', function(req, res) {
    switch (options.type) {
      case 'mp4':
        res.send('video/mp4; codecs="avc1.640029"'); //avc1.42E01F"');
        break;
      case 'mjpeg':
        res.send('video/x-msvideo');
        break;
      case 'webm':
        res.send('video/webm; codecs="vp9"');
        break;
      default:
        res.status(500).send('Error in configuration: video codec ' + videoType + ' not supported.');
        break;
    }
  });

  httpServer = http.Server(app);

  httpServer.listen(options.port, function() {
    logger.info('listening on *:' + options.port);
  });

  videoServer.start(
    {
      server: httpServer,
      videoType: options.type
    },
    function(err) {
      if (err) {
        logger.error(err);
        return;
      }
      logger.info('Server started.');
    }
  );
}

