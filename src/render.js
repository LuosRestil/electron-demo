const { ipcRenderer } = require("electron");
const { Menu, dialog } = require("@electron/remote");
const fs = require('fs');

// Global state
let mediaRecorder;
let recordedChunks = [];

const desktopCapturer = {
  getSources: (opts) =>
    ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES", opts),
};

const video = document.querySelector("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.onclick = getVideoSources;
startBtn.onclick = startRecording;
stopBtn.onclick = stopRecording;

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
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
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  // create a stream of video output from the source window/screen
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // preview the source in video element
  video.srcObject = stream;
  video.play();

  // create the media recorder
  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  // event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function startRecording(evt) {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
}

function stopRecording(evt) {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
}

function handleDataAvailable(evt) {
  recordedChunks.push(evt.data);
}

async function handleStop() {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9"
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const {filepath} = await dialog.showSaveDialog({
    buttonLabel: 'Save Video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  fs.writeFile(filepath, buffer, () => {
    console.log('Video saved successfully!');
  });
}