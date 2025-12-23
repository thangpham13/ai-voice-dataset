let mediaRecorder;
let audioChunks = [];
let audioBlob = null;

let sentences = [];
let currentSentence = "";
let isRecording = false;

let audioContext, analyser, silenceInterval, hasSound = false;

const txtFile = document.getElementById("txtFile");
const sentenceDiv = document.getElementById("sentence");
const preview = document.getElementById("preview");

const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const sendBtn = document.getElementById("send");

const noiseSuppressionEl = document.getElementById("noiseSuppression");
const echoCancellationEl = document.getElementById("echoCancellation");
const autoGainEl = document.getElementById("autoGain");
const detectSilenceEl = document.getElementById("detectSilence");
const silenceStatus = document.getElementById("silenceStatus");

/* LOAD TXT */
txtFile.onchange = async () => {
  const file = txtFile.files[0];
  if (!file) return;

  const text = await file.text();
  sentences = text.split("\n").map(s => s.trim()).filter(Boolean);

  alert(`Đã load ${sentences.length} câu`);
};

/* PICK SENTENCE */
function pickSentence() {
  if (sentences.length === 0) {
    alert("Chưa upload file TXT");
    return false;
  }
  const i = Math.floor(Math.random() * sentences.length);
  currentSentence = sentences[i];
  sentenceDiv.textContent = currentSentence;
  return true;
}

/* START RECORD */
recordBtn.onclick = async () => {
  if (isRecording) return;

  if (!currentSentence && !pickSentence()) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      noiseSuppression: noiseSuppressionEl.checked,
      echoCancellation: echoCancellationEl.checked,
      autoGainControl: autoGainEl.checked
    }
  });

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];
  hasSound = false;

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.fftSize);

  silenceInterval = setInterval(() => {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - 128);
    }
    if (sum / dataArray.length > 3) {
      hasSound = true;
      silenceStatus.textContent = "Có âm thanh ✔";
      silenceStatus.style.color = "#4caf50";
    }
  }, 200);

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    clearInterval(silenceInterval);

    if (detectSilenceEl.checked && !hasSound) {
      alert("Không phát hiện âm thanh, vui lòng thu lại");
      silenceStatus.textContent = "Không có âm ❌";
      silenceStatus.style.color = "#e53935";
      return;
    }

    audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    preview.src = URL.createObjectURL(audioBlob);
    preview.onloadedmetadata = () => preview.play();

    sendBtn.disabled = false;
  };

  mediaRecorder.start();
  isRecording = true;
  recordBtn.disabled = true;
  stopBtn.disabled = false;
};

/* STOP */
stopBtn.onclick = () => {
  if (!isRecording) return;
  mediaRecorder.stop();
  isRecording = false;
  recordBtn.disabled = false;
  stopBtn.disabled = true;
};

/* SEND */
sendBtn.onclick = async () => {
  if (!audioBlob) return;

  const formData = new FormData();
  formData.append("audio", audioBlob);
  formData.append("text", currentSentence);

  await fetch("/upload", { method: "POST", body: formData });

  alert("Đã gửi");

  audioBlob = null;
  currentSentence = "";
  preview.src = "";
  sentenceDiv.textContent = "Sẵn sàng câu tiếp theo";
  sendBtn.disabled = true;
};

/* SHORTCUTS */
document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    isRecording ? stopBtn.click() : recordBtn.click();
  }
  if (e.key === "Enter" && !sendBtn.disabled) sendBtn.click();
  if (e.key.toLowerCase() === "r") {
    audioBlob = null;
    preview.src = "";
    sendBtn.disabled = true;
    recordBtn.click();
  }
});
