const SYSTEM_PROMPT = `Sen dünyaca tanınmış bir finansal analist ve borsa stratejistisin. Goldman Sachs seviyesinde analiz yapıyorsun.

Kullanıcı sana bir haber verir. Şunları yap:

## ZİNCİR ANALİZ
Olay → Birincil etki → İkincil etki → Piyasa yansıması (→ işaretiyle göster)

## HİSSE & VARLIK ÖNERİLERİ
Her öneri için:
**[SEMBOL]** 📈 AL / 📉 SAT | Hedef: %±XX | Güven: %XX | Neden: kısa açıklama

BIST önce: TUPRS, THYAO, EREGL, ASELS, GARAN, BIMAS, SISE, KCHOL, TCELL, PETKM, AKBNK, FROTO
Global: NVDA, XOM, CVX, GLD, USO, TLT, SPY

## DÖVİZ & EMTİA
USD/TRY, Altın (XAU/USD), Petrol (Brent) beklentisi

## SENARYO
🟢 Boğa (%X olasılık): ...
🔴 Ayı (%X olasılık): ...

## ÖZET
En güçlü 1-2 öneri + kısa gerekçe

Türkçe, net, somut rakamlar.
⚠️ Bu analiz yatırım tavsiyesi değildir.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY tanimli degil. Vercel Environment Variables kontrol edin." });
  }

  const { metin } = req.body;
  if (!metin) {
    return res.status(400).json({ error: "metin alani bos" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: `Analiz et:\n\n"${metin}"` },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const mesaj = data?.error?.message || JSON.stringify(data);
      return res.status(response.status).json({ error: mesaj });
    }

    const text = data?.choices?.[0]?.message?.content || "Analiz alinamadi.";
    res.status(200).json({ text });

  } catch (error) {
    res.status(500).json({ error: error.message || "Bilinmeyen sunucu hatasi" });
  }
}
