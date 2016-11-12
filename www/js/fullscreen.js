function toggleFullScreenAndPlay() {
  var vid = document.getElementById('vid');
  if (vid) {
    vid.play();
  }
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.mozRequestFullScreen) {
    document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.webkitRequestFullscreen) {
    document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  }
}

function goFullScreenAndPlayAndForget() {
  window.document.body.removeEventListener('touchstart', goFullScreenAndPlayAndForget);
  toggleFullScreenAndPlay(window.document.documentElement);
}

window.onload = function() {
  document.body.addEventListener('touchstart', goFullScreenAndPlayAndForget, false);
};
