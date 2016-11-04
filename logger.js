var colors = require('colors');

var logger = exports;

logger.debugLevel = 'warn';
logger.log = function(level, message) {
  var levels = ['error', 'warn', 'info'];

  if (levels.indexOf(level) <= levels.indexOf(logger.debugLevel)) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }
    if (level === 'error') {
        console.log(level.inverse + ': ' + message.underline.red);
        return;
    } else if (level === 'warn') {
        console.log(level + ': ' + message.blue);
        return;
    }
    console.log(level + ': ' + message.grey);
  }
};

logger.info = function(message) {
    if (typeof message !== 'string') {
        message = JSON.stringify(message);
    }
    console.log('INFO: '.inverse + message.green);
};
logger.warn = function(message) {
    if (typeof message !== 'string') {
        message = JSON.stringify(message);
    }
    console.log('WARN: '.inverse + ': ' + message.blue);
};
logger.error = function(message) {
    if (typeof message !== 'string') {
        message = JSON.stringify(message);
    }
    console.log('ERROR'.inverse + ': ' + message.underline.red);
};
