# websocket-videostream

Allows to stream output of ffmpeg process to browser in a low-latency fashion, either using mjpeg (with support for old browsers), fragmented mp4 or webm.

### Installation

Requires [Node.js](https://nodejs.org/) v7+ to run.

Install the dependencies and devDependencies and start the server.

```sh
$ npm install -d
$ gulp
$ node . --type $type
```

`$type` can be : mjpeg, mp4 (does not scale and may drift in time in mobile plateforms), webm (experimental and buggy).

