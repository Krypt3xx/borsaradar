// AI simülasyon kararı — hangi hisseyi al/sat/tut
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { aiKim, portfoy, bakiye, haberler, fiyatlar } = req.body;

  const AI_CONFIGS = {
    claude: {
      model: "claude-haiku-4-5",
      endpoint: "https://api.anthropic.com/v1/messages",
      isAnthropic: true,
    },
    gpt: {
      model: "gpt-4o-mini",
      endpoint: "https://api.openai.com/v1/chat/completions",
    },
    llama: {
      model: "llama-3.3-70b-versatile",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
    },
  };

  const portfoyOzet = portfoy.length === 0
    ? "Portföy boş — nakit pozisyonda"
    : portfoy.map(p => `${p.sembol}: ${p.adet} adet @ ₺${p.alisFiyat} (güncel: ₺${p.guncelFiyat || p.alisFiyat})`).join("\n");

  const portfoyDeger = portfoy.reduce((s, p) => s + (p.adet * (p.guncelFiyat || p.alisFiyat)), 0);
  const toplamDeger = bakiye + portfoyDeger;

  const sistem = `Sen bir AI yatırım simülasyonu katılımcısısın. Başlangıç bakiyen ₺100.000 idi.
Görevin: Gerçek piyasa verilerini kullanarak kâr elde etmek.
Kural: Sadece gerçek semboller kullan (BIST: TUPRS, THYAO, GARAN vb. | Global: NVDA, AAPL, GLD, BTC-USD vb.)
Strateji: Kendi risk profiline göre karar ver — agresif mi, temkinli mi, dengeli mi?`;

  const kullanici = `## Güncel Durum
Nakit bakiye: ₺${bakiye.toLocaleString("tr-TR")}
Portföy değeri: ₺${portfoyDeger.toLocaleString("tr-TR")}
Toplam varlık: ₺${toplamDeger.toLocaleString("tr-TR")}

## Mevcut Portföy
${portfoyOzet}

## Son Piyasa Haberleri (özet)
${(haberler || []).slice(0, 8).map(h => `- ${h.baslik}`).join("\n") || "Haber yok"}

## Güncel Fiyatlar
${(fiyatlar || []).slice(0, 10).map(f => `${f.isim}: ${f.fiyat}`).join(" | ")}

## KARAR VER
Şu an ne yapmalısın? SADECE JSON döndür, başka hiçbir şey yazma:
{
  "islem": "AL veya SAT veya TUT",
  "sembol": "işlem yapılacak sembol (TUT ise null)",
  "miktar_tl": işlem tutarı TL cinsinden (sayı),
  "gerekce": "2-3 cümle neden bu kararı verdin",
  "strateji": "kısa açıklama — agresif/temkinli/dengeli",
  "beklenti": "bu pozisyondan ne bekliyorsun",
  "risk": "en büyük risk faktörü"
}`;

  const cfg = AI_CONFIGS[aiKim];
  if (!cfg) return res.status(400).json({ error: "Geçersiz AI" });

  try {
    let text;
    if (cfg.isAnthropic) {
      const r = await fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: cfg.model, max_tokens: 600, system: sistem, messages: [{ role: "user", content: kullanici }] }),
        signal: AbortSignal.timeout(25000),
      });
      const d = await r.json();
      text = d.content?.[0]?.text;
    } else {
      const apiKey = aiKim === "gpt" ? process.env.OPENAI_API_KEY : process.env.GROQ_API_KEY;
      const r = await fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: cfg.model, max_tokens: 600, messages: [{ role: "system", content: sistem }, { role: "user", content: kullanici }] }),
        signal: AbortSignal.timeout(25000),
      });
      const d = await r.json();
      text = d.choices?.[0]?.message?.content;
    }

    if (!text) return res.status(500).json({ error: "AI yanıt vermedi" });

    try {
      const m = text.match(/\{[\s\S]*?\}/);
      const karar = m ? JSON.parse(m[0]) : null;
      if (!karar) return res.status(500).json({ error: "JSON parse hatası", raw: text });
      return res.status(200).json({ ok: true, karar, ts: Date.now() });
    } catch {
      return res.status(500).json({ error: "JSON parse hatası", raw: text });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
