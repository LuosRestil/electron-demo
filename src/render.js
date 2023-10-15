// Global state
let mediaRecorder;
let recordedChunks = [];

// IPC
window.electronAPI.on("VIDEO_SOURCE_SELECTED", handleVideoSourceSelected);
window.electronAPI.on("VIDEO_FILE_SAVED", handleVideoFileSaved);

const video = document.querySelector("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.onclick = displayVideoSourcesMenu;
startBtn.onclick = startRecording;
stopBtn.onclick = stopRecording;

function displayVideoSourcesMenu() {
  window.electronAPI.send("DISPLAY_VIDEO_SOURCES_MENU");
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

  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  window.electronAPI.send("SAVE_VIDEO_FILE", uint8Array);
}

function handleVideoSourceSelected(selectedSource) {
  selectSource(selectedSource);
}

function handleVideoFileSaved() {
  console.log("File saved successfully!");
}