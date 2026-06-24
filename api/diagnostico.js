const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function embed(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 2000) }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  return data.data[0].embedding;
}

async function searchKnowledge(embedding, count = 5) {
  if (!embedding) return [];
  const { data, error } = await supabase.rpc("search_knowledge", {
    query_embedding: embedding,
    match_count: count,
  });
  if (error || !data) return [];
  return data.filter(r => r.similarity > 0.35);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;
    const userContent = messages?.[0]?.content || "";

    // Busca semântica na base de conhecimento
    const queryEmbedding = await embed(userContent);
    const refs = await searchKnowledge(queryEmbedding);

    let ragContext = "";
    if (refs.length > 0) {
      ragContext = `\n\nCONHECIMENTO DE REFERÊNCIA (use para embasar a análise):\n` +
        refs.map((r, i) => `[Ref ${i + 1} — ${r.filename}]\n${r.content}`).join("\n\n");
    }

    // Injeta o contexto RAG na mensagem do usuário
    const enrichedMessages = [{
      ...messages[0],
      content: messages[0].content + ragContext,
    }, ...messages.slice(1)];

    const body = {
      ...req.body,
      model: "claude-sonnet-4-6",
      messages: enrichedMessages,
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: { message: err.message } });
  }
}
