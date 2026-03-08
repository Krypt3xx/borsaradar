const SYSTEM_PROMPT = `Sen dünyaca tanınmış bir finansal analist ve borsa stratejistisin.

Kullanıcı sana bir haber verir. Şunları yap:

## ZİNCİR ANALİZ
Olay → Birincil etki → İkincil etki → Piyasa yansıması

## HİSSE & VARLIK ÖNERİLERİ
**[SEMBOL]** 📈 AL / 📉 SAT | Hedef: %±XX | Güven: %XX | Neden: kısa açıklama
BIST: TUPRS, THYAO, EREGL, ASELS, GARAN, BIMAS, SISE, KCHOL, TCELL, PETKM, AKBNK, FROTO
Global: NVDA, XOM, CVX, GLD, USO

## DÖVİZ & EMTİA
USD/TRY, Altın, Petrol beklentisi

## SENARYO
🟢 Boğa (%X): ... 🔴 Ayı (%X): ...

## ÖZET
En güçlü 1-2 öneri + gerekçe

Türkçe, net, somut rakamlar. ⚠️ Yatırım tavsiyesi değildir.`;

// ── Claude (Anthropic) ──────────────────────────────────────────────────────
async function callClaude(metin, apiKey) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role:"user", content:`Analiz et:\n\n"${metin}"` }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Claude HTTP ${r.status}`);
  return d.content?.map(b=>b.text||"").join("") || "";
}

// ── ChatGPT (OpenAI) ────────────────────────────────────────────────────────
async function callGPT(metin, apiKey) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1200,
      messages: [
        { role:"system", content: SYSTEM_PROMPT },
        { role:"user",   content:`Analiz et:\n\n"${metin}"` },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `GPT HTTP ${r.status}`);
  return d.choices?.[0]?.message?.content || "";
}

// ── Gemini (Google) ─────────────────────────────────────────────────────────
async function callGemini(metin, apiKey) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts:[{ text: SYSTEM_PROMPT }] },
        contents: [{ role:"user", parts:[{ text:`Analiz et:\n\n"${metin}"` }] }],
        generationConfig: { temperature:0.7, maxOutputTokens:1200 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Gemini HTTP ${r.status}`);
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });

  const { metin } = req.body;
  if (!metin) return res.status(400).json({ error:"metin boş" });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_KEY    = process.env.OPENAI_API_KEY;
  const GEMINI_KEY    = process.env.GEMINI_API_KEY;

  // 3 AI'ı paralel çalıştır
  const [claudeResult, gptResult, geminiResult] = await Promise.allSettled([
    ANTHROPIC_KEY ? callClaude(metin, ANTHROPIC_KEY) : Promise.reject(new Error("ANTHROPIC_API_KEY tanımlı değil")),
    OPENAI_KEY    ? callGPT(metin, OPENAI_KEY)       : Promise.reject(new Error("OPENAI_API_KEY tanımlı değil")),
    GEMINI_KEY    ? callGemini(metin, GEMINI_KEY)    : Promise.reject(new Error("GEMINI_API_KEY tanımlı değil")),
  ]);

  res.status(200).json({
    claude: {
      text:  claudeResult.status==="fulfilled" ? claudeResult.value : null,
      error: claudeResult.status==="rejected"  ? claudeResult.reason?.message : null,
    },
    gpt: {
      text:  gptResult.status==="fulfilled" ? gptResult.value : null,
      error: gptResult.status==="rejected"  ? gptResult.reason?.message : null,
    },
    gemini: {
      text:  geminiResult.status==="fulfilled" ? geminiResult.value : null,
      error: geminiResult.status==="rejected"  ? geminiResult.reason?.message : null,
    },
  });
}
