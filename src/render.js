const { ipcRenderer } = require('electron');
const { Menu } = require('@electron/remote');

const desktopCapturer = {
  getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts)
}

const video = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

videoSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source),
      }
    })
  );

  videoOptionsMenu.popup();
}

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // create a stream of video output from the source window/screen
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  video.srcObject = stream;
  video.play();
}