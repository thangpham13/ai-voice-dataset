let mediaRecorder;
let audioChunks = [];
let audioBlob = null;

const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const sendBtn = document.getElementById("send");
const preview = document.getElementById("preview");
const textInput = document.getElementById("text");

recordBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  audioChunks = [];
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    preview.src = URL.createObjectURL(audioBlob);
    sendBtn.disabled = false;
  };

  mediaRecorder.start();
  recordBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;
};

sendBtn.onclick = async () => {
  const text = textInput.value.trim();
  if (!text) {
    alert("Chưa nhập nội dung đọc");
    return;
  }
  if (!audioBlob) {
    alert("Chưa thu âm");
    return;
  }

  const formData = new FormData();
  formData.append("audio", audioBlob);
  formData.append("text", text); // 🔥 DÒNG QUAN TRỌNG

  await fetch("/upload", {
    method: "POST",
    body: formData
  });

  alert("Gửi thành công");

  textInput.value = "";
  audioBlob = null;
  preview.src = "";
  sendBtn.disabled = true;
};
