const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = 3000;

/* 🔑 SUPABASE CONFIG */
const SUPABASE_URL = "https://wufwszthrmgwgmhvwjom.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZndzenRocm1nd2dtaHZ3am9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzMzczOCwiZXhwIjoyMDgxNzA5NzM4fQ.jqdllNaWC9kpoVUKpi16YX5q7SMMk0yOYi8D53_wPwI"; // ⚠️ secret
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.static("public"));

/* Multer giữ file trong RAM */
const upload = multer({ storage: multer.memoryStorage() });

/* Upload */
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    const text = req.body.text;
    const file = req.file;

    const filename = `${Date.now()}.webm`;

    /* Upload audio */
    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(filename, file.buffer, {
        contentType: "audio/webm"
      });

    if (uploadError) throw uploadError;

    /* Lấy public URL */
    const { data } = supabase.storage
      .from("audio")
      .getPublicUrl(filename);

    /* Lưu DB */
    const { error: dbError } = await supabase
      .from("voice_data")
      .insert({
        text,
        audio_url: data.publicUrl
      });

    if (dbError) throw dbError;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* API cho admin */
app.get("/list", async (req, res) => {
  const { data, error } = await supabase
    .from("voice_data")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

app.listen(PORT, () => {
  console.log("Server running http://localhost:3000");
});
