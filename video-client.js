var ws = require('websocket-stream')
var jpegExtractor = require('./jpeg-extractor.js')

var WSStream = function(wsurl) {
    this.wsurl = wsurl;

    this.init = function() {
        var self=this;

        try {
            this.stream = ws(wsurl);
        } catch(e) {};

        this.stream.write(new Buffer('hello'));
        this.stream.on('data', function(data) {
            //console.log("WS DATA",data.toString()); //this is binary
            if(self.ondata)
                self.ondata(data);
        });

        this.stream.socket.onclose = function (event) {
            var reason;
            // See http://tools.ietf.org/html/rfc6455#section-7.4.1
            if (event.code == 1000)
                reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
            else if(event.code == 1001)
                reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
            else if(event.code == 1002)
                reason = "An endpoint is terminating the connection due to a protocol error";
            else if(event.code == 1003)
                reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
            else if(event.code == 1004)
                reason = "Reserved. The specific meaning might be defined in the future.";
            else if(event.code == 1005)
                reason = "No status code was actually present.";
            else if(event.code == 1006)
                reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
            else if(event.code == 1007)
                reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
            else if(event.code == 1008)
                reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
            else if(event.code == 1009)
                reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
            else if(event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
                reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
            else if(event.code == 1011)
                reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
            else if(event.code == 1015)
                reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
            else
                reason = "Unknown reason";

            console.warn("The connection was closed for reason: " + reason);
            if(self.onclose)
                self.onclose(reason,self.wsurl);
        };

        this.stream.socket.onerror = function (event) {
            console.error("socket error",event);
            if(self.onerror)
                self.onerror(event,self.wsurl);
        };
    };
}

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

