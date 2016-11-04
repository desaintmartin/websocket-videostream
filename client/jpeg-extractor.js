/*!
 * jpeg-extractor
 *
 * Copyright(c) 2015 Dmitry Rybin <postbox2020@yandex.ru>
 * MIT Licensed
 */


/**
 * Dep`s
 */

const bufferTools = require('browserify-buffertools');
const util = require('util');
const Transform = require('stream').Transform;

const SOI = new Buffer([0xff, 0xd8]);
const EOI = new Buffer([0xff, 0xd9]);
const STOP = new Buffer([0x74, 0x65, 0x6e, 0x74, 0x2d]); // 'tent-'

/**
 * Constructor
 *
 * @param options
 * @returns {window.JPEGExtractorStream}
 * @constructor
 */

window.JPEGExtractorStream = function(options) {
    if (!(this instanceof window.JPEGExtractorStream))
        return new window.JPEGExtractorStream(options);
    Transform.call(this);
    if (!Buffer.prototype['indexOf']) bufferTools.extend();
    var opt = options instanceof Object ? util._extend({}, options) : {};
    this._checkHttp = 'check_http' in opt ? !!opt['check_http'] : false;
    this._buffer = null;
}
util.inherits(window.JPEGExtractorStream, Transform);

/**
 * Main transform Fn
 *
 * @param chunk
 * @param encoding
 * @param callback
 * @private
 */

window.JPEGExtractorStream.prototype._transform = function (chunk, encoding, callback) {
    var image = null;
    var imgStart, imgEnd;
    while (chunk) {
        if (this._buffer) {
            if (-1 != (imgEnd = chunk.indexOf(EOI))) {
                imgEnd += EOI.length;
                image = Buffer.concat([this._buffer, chunk.slice(0, imgEnd)]);
                if (this._readableState.pipesCount > 0) this.push(image);
                this.emit('image', image);
                this._buffer = null;
                chunk = chunk.slice(imgEnd);
            } else {
                this._buffer = this._checkHttp && -1 != chunk.indexOf(STOP) ? null : Buffer.concat([this._buffer, chunk]);
                chunk = null;
            }
        } else {
            chunk = -1 != (imgStart = chunk.indexOf(SOI)) ? chunk.slice(imgStart) : null;
            if (chunk) this._buffer = new Buffer(0);
        }
    }
    callback();
};

/**
 *
 * @param callback
 * @private
 */

window.JPEGExtractorStream.prototype._flush = function (callback) {
    this._buffer = null;
    callback();
};

/**
 * Exports
 */

/*module.exports = function (options) {
    return new window.JPEGExtractorStream(options);
};*/











