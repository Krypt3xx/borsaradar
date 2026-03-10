// ─── GÜÇLENDİRİLMİŞ ANALİZ SİSTEMİ v2 ───────────────────────────────────────
// Makro bağlam + çoklu zaman dilimi + zamanlama sinyali + sektör haritası

function buildSystemPrompt() {
  return `Sen 20 yıllık deneyime sahip bir baş yatırım stratejistisin. Goldman Sachs, JPMorgan ve Bridgewater'da çalışmış, Türkiye ve gelişmekte olan piyasalar uzmanısın.

TEMEL KURAL: Belirsizliği kabul et. Yanlış kesinlik, doğru belirsizlikten tehlikelidir.
Spekülatif tahminleri "düşük güven" olarak işaretle. Rakamlar gerçekçi ve ulaşılabilir olsun.

GÖREV: Verilen haberi + makro bağlamı + zaman dilimlerini analiz et.

## 1. HABER ETKİ SKORU
Piyasa etkisi: 1-10 (1=önemsiz, 10=piyasa sarsıcı)
Fiyatlanma olasılığı: "Piyasa bu haberi zaten biliyor muydu?" (0-100%)
Fırsat penceresi: Kaç saat/gün bu bilgi avantajı sürer?

## 2. ZİNCİR ETKİ
OLAY → Birincil → İkincil → Sektörel → BIST/TL etkisi (tek satır, ok ile)

## 3. SEKTÖR YÖN HARİTASI
Sadece etkilenenleri yaz: ▲ OLUMLU / ▼ OLUMSUZ / ◆ NÖTR + tek cümle neden

## 4. ÇOKLU ZAMAN DİLİMİ ANALİZİ
**Kısa vade (1-5 gün):** [yön + hedef % + ana katalizör]
**Orta vade (2-4 hafta):** [yön + hedef % + beklenti]
**Uzun vade (1-3 ay):** [yön + temel değişken]

## 5. SOMUT İŞLEM ÖNERİLERİ (en fazla 3 öneri)
Her öneri:
**[SEMBOL]** | 📈 AL / 📉 SAT / ⏸ BEKLE
- Zaman: Hemen gir / Seansı bekle / Düzeltme bekle
- Hedef: %±XX | Stop: %±XX | Güven: %XX
- Giriş koşulu: Ne olursa gir? Ne olursa vazgeç?

BIST Öncelik: TUPRS, THYAO, EREGL, ASELS, GARAN, AKBNK, BIMAS, KCHOL, FROTO, KOZAL
Global: NVDA, GLD, BTC-USD, XOM, TLT

## 6. DÖVİZ & ALTIN
USD/TRY: [yön + hedef] | Altın: [yön + hedef] | Brent: [yön + hedef]

## 7. SENARYO ANALİZİ
🟢 Baz (%XX): Beklenti özeti
🟡 Boğa (%XX): En iyi durum
🔴 Ayı (%XX): En kötü durum + önlem

## 8. PORTFÖY YAPISI ÖNERİSİ
Agresif mi / Defansif mi / Nötr mu? Nakit oranı önerisi?

Türkçe. Kısa ve net. Bullet point yok, başlıklar yeterli.`;
}

// ── Claude ────────────────────────────────────────────────────────────────────
async function callClaude(metin, apiKey) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1800,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: metin }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Claude HTTP ${r.status}`);
  return d.content?.map(b => b.text || "").join("") || "";
}

// ── GPT ───────────────────────────────────────────────────────────────────────
async function callGPT(metin, apiKey) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1800,
      temperature: 0.6,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: metin },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `GPT HTTP ${r.status}`);
  return d.choices?.[0]?.message?.content || "";
}

// ── Groq / Llama ──────────────────────────────────────────────────────────────
async function callGroq(metin, apiKey) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1800,
      temperature: 0.6,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: metin },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Groq HTTP ${r.status}`);
  return d.choices?.[0]?.message?.content || "";
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { metin, tip } = req.body;
  if (!metin) return res.status(400).json({ error: "metin boş" });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_KEY    = process.env.OPENAI_API_KEY;
  const GROQ_KEY      = process.env.GROQ_API_KEY;

  // Makro bağlam — döviz + fiyat verileri
  let makroBaglam = "";
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const [dovizR, fiyatR] = await Promise.allSettled([
      fetch(`${baseUrl}/api/doviz`, { signal: AbortSignal.timeout(4000) }),
      fetch(`${baseUrl}/api/prices`, { signal: AbortSignal.timeout(4000) }),
    ]);

    let kurlar = "";
    if (dovizR.status === "fulfilled" && dovizR.value.ok) {
      const d = await dovizR.value.json();
      if (d.kurlar?.USDTRY) {
        kurlar = `USD/TRY: ${d.kurlar.USDTRY} | EUR/TRY: ${d.kurlar.EURTRY||"?"} | Altın/TL: ${d.kurlar.ALTIN_TL||"?"} | Altın/$: ${d.kurlar.ALTIN||"?"}`;
      }
    }

    let piyasalar = "";
    if (fiyatR.status === "fulfilled" && fiyatR.value.ok) {
      const d = await fiyatR.value.json();
      if (d.fiyatlar?.length) {
        piyasalar = d.fiyatlar.slice(0, 8).map(f => `${f.isim}: ${f.fiyat}${f.degisim != null ? ` (${f.degisim >= 0 ? "+" : ""}${f.degisim?.toFixed(2)}%)` : ""}`).join(" | ");
      }
    }

    const simdi = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", hour: "2-digit", minute: "2-digit" });
    const saat = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
    const saatNum = parseInt(saat.split(":")[0]);
    const piyasaAcik = saatNum >= 10 && saatNum < 18;

    makroBaglam = `\n\n═══ MAKRO BAĞLAM (GERÇEK ZAMANLI — ${simdi}) ═══
Piyasa durumu: ${piyasaAcik ? "BIST AÇIK ⚡" : "BIST KAPALI 🔴"}
${kurlar ? `Döviz: ${kurlar}` : ""}
${piyasalar ? `Piyasalar: ${piyasalar}` : ""}
NOT: Bu verileri analiz bazı al — asla tahmin kullanma, sadece yukarıdaki gerçek rakamları kullan.
═══════════════════════════════════════════`;
  } catch {}

  // Teknik analiz isteği ise farklı prompt
  if (tip === "teknik") {
    const metinKurlu = metin + makroBaglam;
    const [cR, gR, llR] = await Promise.allSettled([
      ANTHROPIC_KEY ? callClaude(metinKurlu, ANTHROPIC_KEY) : Promise.reject(new Error("ANTHROPIC_API_KEY eksik")),
      OPENAI_KEY ? callGPT(metinKurlu, OPENAI_KEY) : Promise.reject(new Error("OPENAI_API_KEY eksik")),
      GROQ_KEY ? callGroq(metinKurlu, GROQ_KEY) : Promise.reject(new Error("GROQ_API_KEY eksik")),
    ]);
    return res.status(200).json({
      claude: { text: cR.status==="fulfilled"?cR.value:null, error: cR.status==="rejected"?cR.reason?.message:null },
      gpt:    { text: gR.status==="fulfilled"?gR.value:null, error: gR.status==="rejected"?gR.reason?.message:null },
      gemini: { text: llR.status==="fulfilled"?llR.value:null, error: llR.status==="rejected"?llR.reason?.message:null },
    });
  }

  // Haber analizi — tam bağlam ile
  const metinKurlu = `Şu haberi/durumu analiz et ve yatırım fırsatı değerlendir:\n\n"${metin}"${makroBaglam}`;

  const [claudeR, gptR, groqR] = await Promise.allSettled([
    ANTHROPIC_KEY ? callClaude(metinKurlu, ANTHROPIC_KEY) : Promise.reject(new Error("ANTHROPIC_API_KEY eksik — Vercel'e ekle")),
    OPENAI_KEY    ? callGPT(metinKurlu, OPENAI_KEY)    : Promise.reject(new Error("OPENAI_API_KEY eksik")),
    GROQ_KEY      ? callGroq(metinKurlu, GROQ_KEY)      : Promise.reject(new Error("GROQ_API_KEY eksik")),
  ]);

  res.status(200).json({
    claude: { text: claudeR.status==="fulfilled"?claudeR.value:null, error: claudeR.status==="rejected"?claudeR.reason?.message:null, model: "Claude Haiku" },
    gpt:    { text: gptR.status==="fulfilled"?gptR.value:null,    error: gptR.status==="rejected"?gptR.reason?.message:null,    model: "GPT-4o Mini" },
    gemini: { text: groqR.status==="fulfilled"?groqR.value:null,   error: groqR.status==="rejected"?groqR.reason?.message:null,   model: "Llama 3.3 70B" },
  });
}
