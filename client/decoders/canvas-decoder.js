const jpegExtractor = require('../jpeg-extractor');
const WSStream = require('../wsstream');

const mjpegDecoder = new JPEGExtractorStream();
const canvas = document.getElementById('cid');
var ctxt = canvas.getContext('2d');
var websocketVideoStream = new WSStream('ws://' + location.hostname);

function decodeAndPlayWithCanvas() {
  mjpegDecoder.on('image', onImage);
}

function onImage(imgData) {
  var img = null;
  try {
    img = new Image();
  } catch (e) {
    //console.log
  }
  var w, h;
  var uInt8Array = imgData;
  var i = uInt8Array.length;
  var binaryString = [i];
  while (i--) {
    binaryString[i] = String.fromCharCode(uInt8Array[i]);
  }
  var data = binaryString.join('');
  var base64 = window.btoa(data);
  img.src = 'data:image/jpeg;base64,' + base64;
  img.onload = function() {
    w = img.width; h = img.height;
    ctxt.drawImage(img, 0, 0, w, h, 0, 0, ctxt.canvas.width, ctxt.canvas.height);
  };
  img.onerror = function(stuff) {
  };
}

module.exports = decodeAndPlayWithCanvas;
