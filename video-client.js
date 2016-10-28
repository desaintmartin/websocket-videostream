var jpegExtractor = require('./jpeg-extractor.js');
var WSStream = require('./wsstream.js');

/* initialise media element */
var video = document.getElementById('vid');
var canvas = document.getElementById('cid');
var ctxt = canvas.getContext("2d");
var mediaSource = null;
var sourceBuffer = null;
var queue=[];
var mimeCodec = 'video/x-msvideo';//'video/webm; codecs="vp8,vorbis"';//'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';//'video/mp4; codecs="avc1.42c01e"'

/* special websocket stream */
var myStream = new WSStream('ws://' + location.hostname);
myStream.onclose = myStream.onerror = function() {
  // Reload the page on server-side error (it should not be closed)
  setTimeout(function() {
    window.location.reload();
  }, 2000);
}

mjpegDecoder = new JPEGExtractorStream();

if (!('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec))) {
    console.log('Video MediaElement does not support: '+mimeCodec+', fallback to mjpeg.');
    mjpegDecoder.on('image', function (imgData) {
        var img = null;
        try {
            img = new Image;
        } catch(e) {
            //console.log
        }
        var w,h;
        var uInt8Array = imgData;
        var i = uInt8Array.length;
        var binaryString = [i];
        while (i--) {
          binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        var data = binaryString.join('');
        var base64 = window.btoa(data);
        img.src = "data:image/jpeg;base64," + base64;
        img.onload = function () {
             w=img.width; h=img.height;
             ctxt.drawImage(img,0,0,w,h,0,0,ctxt.canvas.width,ctxt.canvas.height);
        };
        img.onerror = function (stuff) {
        };
    });

    myStream.ondata = function(_d) {
        mjpegDecoder.write(_d);
    }
    myStream.init();

} else {
    console.log('Video MediaElement supports: '+mimeCodec+'');
    mediaSource = new MediaSource();
    video.src = window.URL.createObjectURL(mediaSource);
    video.style.display = 'block';
    canvas.style.display = 'hidden';
    /* bind mediaSource buffer to websocket stream data */
    mediaSource.addEventListener('sourceopen', function(){

            sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);

            sourceBuffer.addEventListener('updateend', function() {
                if ( queue.length ) {
                    sourceBuffer.appendBuffer(queue.shift());
                }
            }, false);

            sourceBuffer.addEventListener('remove', function() {
                console.error("source buffer remove");
            }, false);

            myStream.ondata = function(_d) {
                 //var d=new Uint8Array(_d);
                 var d=_d;
                 if (!sourceBuffer.updating && sourceBuffer.buffered.length > 0) {
                    console.debug("buffer not updating");
                    sourceBuffer.appendBuffer(d);// new Uint8Array(d);
                 } else {
                    if(!sourceBuffer.updating) sourceBuffer.appendBuffer(d);
                    else queue.push(d);
                 }
                if (video.paused) {
                    video.play();
                }
            }
            myStream.init();
    });
}

