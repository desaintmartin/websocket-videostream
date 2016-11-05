function toggleFullScreenAndPlay() {
  document.getElementById('vid').play();
  if (!document.fullscreenElement &&
    !document.mozFullScreenElement && !document.webkitFullscreenElement) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }
}

function goFullScreenAndPlayAndForget() {
  window.document.body.removeEventListener('touchstart', goFullScreenAndForget);
  window.document.body.removeEventListener('click', goFullScreenAndForget);
  toggleFullScreeniAndPlay(window.document.documentElement);
};

window.onload = function() {
  document.body.addEventListener('touchstart', goFullScreenAndPlayAndForget, false);
}
