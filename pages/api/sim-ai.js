// AI simülasyon kararı — portföy risk yönetimi dahil
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { aiKim, portfoy, bakiye, haberler, fiyatlar } = req.body;

  const AI_CONFIGS = {
    claude: { model:"claude-haiku-4-5", endpoint:"https://api.anthropic.com/v1/messages", isAnthropic:true },
    gpt:    { model:"gpt-4o-mini", endpoint:"https://api.openai.com/v1/chat/completions" },
    llama:  { model:"llama-3.3-70b-versatile", endpoint:"https://api.groq.com/openai/v1/chat/completions" },
  };

  const portfoyDeger = portfoy.reduce((s,p) => s + (p.adet * (p.guncelFiyat||p.alisFiyat)), 0);
  const toplamDeger  = bakiye + portfoyDeger;
  const nakitOrani   = toplamDeger > 0 ? ((bakiye / toplamDeger) * 100).toFixed(1) : "100.0";

  // Risk metrikleri hesapla
  const pozisyonlar = portfoy.map(p => {
    const guncel = p.guncelFiyat || p.alisFiyat;
    const plPct  = ((guncel - p.alisFiyat) / p.alisFiyat * 100).toFixed(2);
    const agirlik= (p.adet * guncel / toplamDeger * 100).toFixed(1);
    return `${p.sembol}: ${p.adet.toFixed(3)} adet | Alış: ₺${p.alisFiyat} | Güncel: ₺${guncel} | K/Z: ${plPct}% | Ağırlık: %${agirlik}`;
  });

  // Stop-loss ihlali kontrol
  const stopIhlalleri = portfoy.filter(p => {
    const guncel = p.guncelFiyat || p.alisFiyat;
    return ((guncel - p.alisFiyat) / p.alisFiyat * 100) < -8; // -%8 stop seviyesi
  });

  const sistem = `Sen bir AI yatırım simülasyonu katılımcısısın. Başlangıç bakiyen ₺100.000 idi.
Görevin: Gerçek piyasa verilerini kullanarak uzun vadede en yüksek getiriyi elde etmek.

RİSK YÖNETİMİ KURALLARI (bunlara uy):
1. Tek pozisyon max portföyün %30'u olabilir
2. Stop-loss: -%8 altına düşen pozisyonları kapat
3. Nakit oranı min %15 tut (likidite için)
4. Döviz/emtia riski hedge et — çok TL varlık varsa biraz USD/altın al
5. Momentum takip et ama kalabalığın peşinden gitme

Sadece gerçek semboller kullan. BIST: TUPRS, THYAO, GARAN, AKBNK, EREGL, ASELS, BIMAS, FROTO, KCHOL, KOZAL
Global: NVDA, AAPL, MSFT, GLD, BTC-USD, XOM, TLT`;

  const kullanici = `## GÜNCEL DURUM
Nakit: ₺${bakiye.toLocaleString("tr-TR")} (%${nakitOrani})
Portföy değeri: ₺${portfoyDeger.toLocaleString("tr-TR")}
Toplam varlık: ₺${toplamDeger.toLocaleString("tr-TR")}

## PORTFÖY POZİSYONLARI
${pozisyonlar.length ? pozisyonlar.join("\n") : "Portföy boş — nakit"}

${stopIhlalleri.length ? `⚠️ STOP-LOSS İHLALİ: ${stopIhlalleri.map(p=>p.sembol).join(", ")} — -%8 altında, SAT değerlendir!` : ""}

## SON HABERLERİN ÖZETİ
${(haberler||[]).slice(0,6).map(h=>`- ${h.baslik}`).join("\n") || "Haber yok"}

## GÜNCEL FİYATLAR
${(fiyatlar||[]).slice(0,8).map(f=>`${f.isim}: ${f.fiyat}`).join(" | ")}

## KARAR VER
Risk yönetimi kurallarını göz önünde bulundurarak karar ver.
SADECE JSON döndür, markdown veya açıklama yazma:
{
  "islem": "AL veya SAT veya TUT",
  "sembol": "işlem sembolü (TUT ise null)",
  "miktar_tl": tutar (sayı, TUT ise 0),
  "gerekce": "2-3 cümle — neden bu karar, hangi risk/fırsatı görüyorsun",
  "strateji": "agresif / dengeli / defansif",
  "beklenti": "bu pozisyondan ne bekliyorsun",
  "risk": "en büyük risk faktörü"
}`;

  const cfg = AI_CONFIGS[aiKim];
  if (!cfg) return res.status(400).json({ error:"Geçersiz AI" });

  try {
    let text;
    if (cfg.isAnthropic) {
      const r = await fetch(cfg.endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:cfg.model,max_tokens:600,system:sistem,messages:[{role:"user",content:kullanici}]}),
        signal:AbortSignal.timeout(25000),
      });
      const d = await r.json();
      text = d.content?.[0]?.text;
    } else {
      const apiKey = aiKim==="gpt" ? process.env.OPENAI_API_KEY : process.env.GROQ_API_KEY;
      const r = await fetch(cfg.endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
        body:JSON.stringify({model:cfg.model,max_tokens:600,temperature:0.6,messages:[{role:"system",content:sistem},{role:"user",content:kullanici}]}),
        signal:AbortSignal.timeout(25000),
      });
      const d = await r.json();
      text = d.choices?.[0]?.message?.content;
    }

    if (!text) throw new Error("Boş yanıt");
    const clean = text.replace(/```json|```/g,"").trim();
    const start = clean.indexOf("{"), end = clean.lastIndexOf("}");
    if (start===-1||end===-1) throw new Error("JSON bulunamadı");
    const karar = JSON.parse(clean.slice(start, end+1));

    // Güvenlik sınırları — max %30 pozisyon
    if (karar.islem==="AL" && karar.miktar_tl > toplamDeger * 0.30) {
      karar.miktar_tl = Math.floor(toplamDeger * 0.28);
      karar.gerekce += ` [Tutar %28'e düşürüldü — tek pozisyon limiti]`;
    }

    return res.status(200).json({ ok:true, karar });
  } catch(e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
}
