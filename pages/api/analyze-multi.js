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

// ── Claude → claude-haiku-3-5 (en ucuz, ~$0.001/analiz) ──────────────────
async function callClaude(metin, apiKey) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",   // En ucuz Claude modeli
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Analiz et:\n\n"${metin}"` }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Claude HTTP ${r.status}`);
  return d.content?.map(b => b.text || "").join("") || "";
}

// ── ChatGPT → gpt-4o-mini (ucuz, $5 kredi uzun sürer) ────────────────────
async function callGPT(metin, apiKey) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Analiz et:\n\n"${metin}"` },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `GPT HTTP ${r.status}`);
  return d.choices?.[0]?.message?.content || "";
}

// ── Gemini → gemini-2.0-flash-lite (ücretsiz tier var) ───────────────────
async function callGemini(metin, apiKey) {
  // Sırayla dene: lite → flash → pro
  const modeller = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  for (const model of modeller) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: `Analiz et:\n\n"${metin}"` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );
      const d = await r.json();
      // Kota hatası veya model bulunamadı → bir sonrakini dene
      if (!r.ok) {
        const errMsg = d?.error?.message || "";
        if (errMsg.includes("quota") || errMsg.includes("not found") || errMsg.includes("not supported")) {
          continue;
        }
        throw new Error(errMsg || `Gemini HTTP ${r.status}`);
      }
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) return text;
    } catch (e) {
      // Son model de başarısız olduysa fırlat
      if (model === modeller[modeller.length - 1]) throw e;
    }
  }
  throw new Error("Tüm Gemini modelleri kullanılamıyor. API key kotası dolmuş olabilir.");
}

// ── HANDLER ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { metin } = req.body;
  if (!metin) return res.status(400).json({ error: "metin boş" });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_KEY    = process.env.OPENAI_API_KEY;
  const GEMINI_KEY    = process.env.GEMINI_API_KEY;

  const [claudeR, gptR, geminiR] = await Promise.allSettled([
    ANTHROPIC_KEY
      ? callClaude(metin, ANTHROPIC_KEY)
      : Promise.reject(new Error("ANTHROPIC_API_KEY eksik — Vercel Environment Variables'a ekle")),
    OPENAI_KEY
      ? callGPT(metin, OPENAI_KEY)
      : Promise.reject(new Error("OPENAI_API_KEY eksik — Vercel Environment Variables'a ekle")),
    GEMINI_KEY
      ? callGemini(metin, GEMINI_KEY)
      : Promise.reject(new Error("GEMINI_API_KEY eksik — Vercel Environment Variables'a ekle")),
  ]);

  res.status(200).json({
    claude: {
      text:  claudeR.status === "fulfilled" ? claudeR.value : null,
      error: claudeR.status === "rejected"  ? claudeR.reason?.message : null,
    },
    gpt: {
      text:  gptR.status === "fulfilled" ? gptR.value : null,
      error: gptR.status === "rejected"  ? gptR.reason?.message : null,
    },
    gemini: {
      text:  geminiR.status === "fulfilled" ? geminiR.value : null,
      error: geminiR.status === "rejected"  ? geminiR.reason?.message : null,
    },
  });
}
