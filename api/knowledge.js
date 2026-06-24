const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}

async function embed(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "OpenAI embedding error");
  return data.data[0].embedding;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Upload: recebe { filename, text }
    const { filename, text } = req.body;
    if (!filename || !text) return res.status(400).json({ error: "filename e text obrigatórios" });

    // Remove chunks antigos do mesmo arquivo
    await supabase.from("knowledge_base").delete().eq("filename", filename);

    const chunks = chunkText(text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " "));

    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embed(chunks[i]);
      rows.push({ filename, chunk_index: i, content: chunks[i], embedding });
    }

    const { error } = await supabase.from("knowledge_base").insert(rows);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true, chunks: rows.length });
  }

  if (req.method === "GET") {
    // Lista arquivos únicos
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("filename, chunk_index")
      .order("filename");
    if (error) return res.status(500).json({ error: error.message });

    const files = {};
    for (const row of data) {
      files[row.filename] = (files[row.filename] || 0) + 1;
    }
    return res.status(200).json({ files: Object.entries(files).map(([name, chunks]) => ({ name, chunks })) });
  }

  if (req.method === "DELETE") {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "filename obrigatório" });
    const { error } = await supabase.from("knowledge_base").delete().eq("filename", filename);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
