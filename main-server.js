var cluster = require('cluster');
var express = require('express');
var http = require('http');
var websocket = require('./');
var logger = require('./logger');
var videoServer = require('./video-server.js');


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
  // XXX move me to config file
  var config = {
    videoCodec: 'mp4', // can be one of 'mp4', 'mjpeg'
    port: 80
  }

  var app = express();

  app.use(express.static(__dirname + '/www/'));
  app.get('/getCodec', function (req, res) {
    res.send(config.videoCodec);
  })

  httpServer = http.Server(app);

  httpServer.listen(config.port, function() {
    logger.info('listening on *:' + config.port);
  });

  videoServer.start(
    {server: httpServer},
    function(err) {
      console.error(err);
    }
  );
}
