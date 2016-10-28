function toggleFullScreen() {
    if (!document.fullscreenElement &&    // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    }
}

function goFullScreenAndForget() {
    window.document.body.removeEventListener('touchstart', goFullScreenAndForget);
    window.document.body.removeEventListener('click', goFullScreenAndForget);
    toggleFullScreen(window.document.documentElement);
};

window.onload = function() {
  document.body.addEventListener('touchstart', goFullScreenAndForget, false);
  document.body.addEventListener('click', goFullScreenAndForget, false);
}
