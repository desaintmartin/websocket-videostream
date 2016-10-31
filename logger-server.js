var SimpleNodeLogger = require('simple-node-logger'),
  opts = {},
  logger = SimpleNodeLogger.createSimpleLogger(opts);

function log(message) {
  logger.info(message);
}

module.exports = log
