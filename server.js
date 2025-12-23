const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

/* 🔑 SUPABASE CONFIG */
const SUPABASE_URL = "https://wufwszthrmgwgmhvwjom.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZndzenRocm1nd2dtaHZ3am9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzMzczOCwiZXhwIjoyMDgxNzA5NzM4fQ.jqdllNaWC9kpoVUKpi16YX5q7SMMk0yOYi8D53_wPwI"; // ❗ nên đưa vào ENV
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* 👉 TRẢ GIAO DIỆN CHÍNH */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* Multer giữ file trong RAM */
const upload = multer({ storage: multer.memoryStorage() });

/* 🎙️ Upload audio */
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file || !req.body.text) {
      return res.status(400).json({ error: "Thiếu audio hoặc text" });
    }

    const filename = `${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(filename, req.file.buffer, {
        contentType: "audio/webm",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("audio")
      .getPublicUrl(filename);

    const { error: dbError } = await supabase
      .from("voice_data")
      .insert({
        text: req.body.text,
        audio_url: data.publicUrl,
      });

    if (dbError) throw dbError;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* 📊 Admin API */
app.get("/list", async (req, res) => {
  const { data, error } = await supabase
    .from("voice_data")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
