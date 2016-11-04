var colors = require('colors');

var SimpleNodeLogger = require('simple-node-logger'),
  opts = {},
  logger = SimpleNodeLogger.createSimpleLogger(opts),
  debugLevel = 'info';

function log(message, level) {
  if (!level) {
    level = 'info';
  }
  var levels = ['error', 'warn', 'info'];

  if (levels.indexOf(level) <= levels.indexOf(debugLevel)) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }
    if (level === 'error') {
        logger.error(level.inverse + ': ' + message.underline.red);
        return;
    } else if (level === 'warn') {
        logger.warn(level + ': ' + message.blue);
        return;
    }
    logger.info(message.grey);
  }
};

log.info = function(message) {
  log(message, 'info');
}
log.warn = function(message) {
  log(message, 'warn');
}
log.error = function(message) {
  log(message, 'error');
}

module.exports = log;

