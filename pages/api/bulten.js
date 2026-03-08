// Günlük sabah bülteni — son haberleri toplayıp 3 AI ile özet üretir
const BULTEN_PROMPT = `Sen Goldman Sachs'ın baş Türkiye stratejistisin. Sabah brifingini hazırlıyorsun.

Aşağıdaki haberleri analiz ederek yatırımcı için SABAH BÜLTENİ hazırla:

## 🌅 SABAH BRİFİNGİ — [BUGÜNÜN TARİHİ]

## 1. GENEL PİYASA TONU
Bugün piyasalar nasıl açacak? Genel hava: OLUMLU / KARIŞIK / OLUMSUZ
Risk iştahı: YÜKSEK / NORMAL / DÜŞÜK
Gerekçe: 2-3 cümle

## 2. BUGÜNÜN EN KRİTİK 3 GELİŞMESİ
Her biri için:
🔴/🟡/🟢 [Başlık] → Piyasa etkisi nedir, hangi hisseler etkilenir

## 3. BIST İÇİN YÖN
- Genel beklenti: ▲ YUKARI / ▼ AŞAĞI / ◆ YATAY
- İzlenecek seviyeler: destek X, direnç Y
- Öne çıkacak sektörler: ...
- Kaçınılacak sektörler: ...

## 4. DÖVİZ & ALTIN RADAR
- USD/TRY: Beklenti ve kritik seviye
- Altın: Yön
- Petrol: Yön ve Türkiye etkisi

## 5. BUGÜNÜN İŞLEM FİKİRLERİ
En fazla 3 somut fikir:
**[SEMBOL]** → Neden, hedef, stop, zaman ufku

## 6. DİKKAT EDİLECEKLER
- Bugün açıklanacak veriler / toplantılar
- Risk faktörleri
- "Olursa ne olur" senaryosu

## 7. ÖZET KARAR
⚡ Bugün için 1 cümle net yön kararı

Türkçe, özlü, somut. Spekülatif değil, veriye dayalı.
⚠️ Yatırım tavsiyesi değildir.`;

async function aiAnaliz(metin, key, tip) {
  if (tip === "groq") {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body: JSON.stringify({
        model:"llama-3.3-70b-versatile", max_tokens:1800, temperature:0.6,
        messages:[{role:"system",content:BULTEN_PROMPT},{role:"user",content:metin}],
      }),
      signal: AbortSignal.timeout(50000),
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d?.error?.message||`Groq ${r.status}`);
    return d.choices?.[0]?.message?.content||"";
  }
  if (tip === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body: JSON.stringify({
        model:"gpt-4o-mini", max_tokens:1800, temperature:0.6,
        messages:[{role:"system",content:BULTEN_PROMPT},{role:"user",content:metin}],
      }),
      signal: AbortSignal.timeout(50000),
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d?.error?.message||`GPT ${r.status}`);
    return d.choices?.[0]?.message?.content||"";
  }
  if (tip === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},
      body: JSON.stringify({
        model:"claude-haiku-4-5", max_tokens:1800,
        system: BULTEN_PROMPT,
        messages:[{role:"user",content:metin}],
      }),
      signal: AbortSignal.timeout(50000),
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d?.error?.message||`Claude ${r.status}`);
    return d.content?.map(b=>b.text||"").join("")||"";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { haberler } = req.body;
  if (!haberler?.length) return res.status(400).json({error:"haberler boş"});

  const tarih = new Date().toLocaleDateString("tr-TR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const haberOzeti = haberler.slice(0,20).map((h,i)=>`${i+1}. [${h.kategori}] ${h.baslik} (${h.kaynak})`).join("\n");
  const prompt = `Tarih: ${tarih}\n\nSon haberler:\n${haberOzeti}\n\nBu haberlere göre sabah bültenini hazırla.`;

  const [groqR, gptR, claudeR] = await Promise.allSettled([
    process.env.GROQ_API_KEY   ? aiAnaliz(prompt, process.env.GROQ_API_KEY,   "groq")     : Promise.reject(new Error("GROQ_API_KEY eksik")),
    process.env.OPENAI_API_KEY ? aiAnaliz(prompt, process.env.OPENAI_API_KEY, "openai")   : Promise.reject(new Error("OPENAI_API_KEY eksik")),
    process.env.ANTHROPIC_API_KEY ? aiAnaliz(prompt, process.env.ANTHROPIC_API_KEY, "anthropic") : Promise.reject(new Error("ANTHROPIC_API_KEY eksik")),
  ]);

  res.status(200).json({
    tarih,
    llama:  { text: groqR.status==="fulfilled"  ? groqR.value  : null, error: groqR.status==="rejected"  ? groqR.reason?.message  : null },
    gpt:    { text: gptR.status==="fulfilled"   ? gptR.value   : null, error: gptR.status==="rejected"   ? gptR.reason?.message   : null },
    claude: { text: claudeR.status==="fulfilled"? claudeR.value: null, error: claudeR.status==="rejected"? claudeR.reason?.message : null },
  });
}
