const fs = require("fs");
const path = require("path");
const { getDocument } = require("pdfjs-dist/legacy/build/pdf.mjs");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const BATCH_SIZE = 20; // embeddings por vez

const BOOKS = [
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/Cowell and Tyler_s Diagnostic Cytology and Hematology of the Dog and Cat, 5th Edition (VetBooks.ir).pdf",
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/Cunningham Tratado de Fisiologi - Bradley Klein-2.pdf",
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/Hematologia e Bioquimica Clinica Veterinaria-1-1.pdf",
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/KANEKO_clinical-biochemistry-of-domestic-animals-sixth-edition.pdf",
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/Schalm's Veterinary Hematology, 7th Edition.pdf",
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/Stockham - Fundamentos de Patologia Clínica Veterinária - Stockham.pdf",
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/Tratado de Medicina Interna de - Marcia Marques Jerico, Joao Ped-ilovepdf-compressed.pdf",
  "C:/Users/Curiel/Desktop/drive-download-20260624T134055Z-3-001/Tratado de Medicina Interna de caes e gatos - santa biblia de 7k de pages.pdf",
];

function chunkText(text) {
  const clean = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ").replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    chunks.push(clean.slice(start, start + CHUNK_SIZE));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter(c => c.trim().length > 100);
}

async function embedBatch(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "OpenAI error");
  return data.data.map(d => d.embedding);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function indexBook(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n📖 Processando: ${filename}`);

  const buffer = fs.readFileSync(filePath);
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdfDoc = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(s => s.str).join(" ") + "\n";
  }
  const chunks = chunkText(fullText);
  console.log(`   ${chunks.length} chunks gerados`);

  // Remove chunks antigos
  await supabase.from("knowledge_base").delete().eq("filename", filename);

  let inserted = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await embedBatch(batch);
      const rows = batch.map((content, j) => ({
        filename,
        chunk_index: i + j,
        content,
        embedding: embeddings[j],
      }));
      const { error } = await supabase.from("knowledge_base").insert(rows);
      if (error) throw new Error(error.message);
      inserted += batch.length;
      process.stdout.write(`\r   ${inserted}/${chunks.length} chunks indexados...`);
      await sleep(200); // respeita rate limit da OpenAI
    } catch (e) {
      console.error(`\n   Erro no batch ${i}: ${e.message}`);
      await sleep(2000);
      i -= BATCH_SIZE; // retry
    }
  }
  console.log(`\n   ✅ ${filename} concluído!`);
}

async function main() {
  console.log("🚀 LIVUS — Indexando base de conhecimento veterinário\n");
  for (const book of BOOKS) {
    if (!fs.existsSync(book)) {
      console.log(`⚠️  Arquivo não encontrado: ${path.basename(book)}`);
      continue;
    }
    await indexBook(book);
  }
  console.log("\n✅ Todos os livros indexados com sucesso!");
}

main().catch(console.error);
