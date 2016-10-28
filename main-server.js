var cluster = require('cluster');
var express = require('express');
var http = require('http');
var websocket = require('./');
var logger = require('./logger');
var video = require('./video-server.js');

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
}

if (cluster.isWorker) {
  var app = express();
  app.use(express.static(__dirname + '/www/'));

  http_port = 80;
  server = http.Server(app);

  video.start(
    {server: server},
    function(){
      console.log('video server is running')
    }
  )

  server.listen(http_port, function(){
    logger.info('listening on *:'+http_port);
  });
}

