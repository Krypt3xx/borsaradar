// PIYASA DUYGU ENDEKSİ — son haberlerin tonunu sayısallaştırır
// Korku / Nötr / Açgözlülük  (0-100)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { haberler } = req.body;
  if (!haberler?.length) return res.status(400).json({ error: "haberler boş" });

  // Lokal kelime tabanlı hızlı skor (API'siz, anlık)
  const POZITIF = ["yükseliş","artış","rekor","büyüme","güçlü","al","fırsat","toparlanma","pozitif","iyileşme","kâr","kazanç","rally","surge","gain","growth","strong","bullish","beat","exceed","record","profit","rise","jump","soar"];
  const NEGATIF = ["düşüş","gerileme","kayıp","risk","tehlike","kriz","sat","zayıf","olumsuz","endişe","baskı","çöküş","crash","fall","drop","loss","weak","bearish","miss","decline","sell","fear","warn","cut","crisis","collapse","recession"];
  const KORKU   = ["savaş","kriz","iflas","panik","çöküş","crash","war","bankrupt","panic","collapse","default","sanction","embargo","attack","emergency"];

  let puan = 0, toplam = 0, korkuSayac = 0;
  const son50 = haberler.slice(0, 50);

  son50.forEach(h => {
    const metin = (h.baslik + " " + (h.ozet || "")).toLowerCase();
    let hPuan = 0;
    POZITIF.forEach(k => { if (metin.includes(k)) hPuan += 1; });
    NEGATIF.forEach(k => { if (metin.includes(k)) hPuan -= 1; });
    KORKU.forEach(k => { if (metin.includes(k)) korkuSayac++; });
    if (h.yon === "POZİTİF") hPuan += 2;
    if (h.yon === "NEGATİF") hPuan -= 2;
    if (h.etki === "YÜKSEK") hPuan *= 1.5;
    puan += hPuan;
    toplam++;
  });

  const normalize = toplam > 0 ? Math.max(0, Math.min(100, Math.round(50 + (puan / toplam) * 15))) : 50;
  const korkuOrani = Math.min(100, Math.round((korkuSayac / Math.max(toplam, 1)) * 100 * 3));
  const endeks = Math.max(0, Math.min(100, normalize - korkuOrani * 0.3));

  let etiket, renk, aciklama;
  if (endeks >= 75) { etiket = "AŞIRI AÇGÖZLÜLÜK"; renk = "#ff4444"; aciklama = "Piyasa eufori bölgesinde — dikkatli ol, zirve yakın olabilir"; }
  else if (endeks >= 60) { etiket = "AÇGÖZLÜLÜK"; renk = "#ff8800"; aciklama = "İyimser hava hakim — momentum devam edebilir ama risk artıyor"; }
  else if (endeks >= 45) { etiket = "NÖTR"; renk = "#aaaaaa"; aciklama = "Dengeli piyasa — yön belirsiz, seçici ol"; }
  else if (endeks >= 30) { etiket = "KORKU"; renk = "#44aaff"; aciklama = "Temkinli satıcılar hakim — iyi hisseler ucuzluyor olabilir"; }
  else { etiket = "AŞIRI KORKU"; renk = "#00ddaa"; aciklama = "Panik satışı bölgesi — tarihin istatistiksel alım fırsatı"; }

  // Kategori bazlı duygu dağılımı
  const kategoriDuygu = {};
  son50.forEach(h => {
    if (!h.kategori) return;
    if (!kategoriDuygu[h.kategori]) kategoriDuygu[h.kategori] = { poz: 0, neg: 0, toplam: 0 };
    kategoriDuygu[h.kategori].toplam++;
    if (h.yon === "POZİTİF") kategoriDuygu[h.kategori].poz++;
    if (h.yon === "NEGATİF") kategoriDuygu[h.kategori].neg++;
  });

  const kategoriSkolar = Object.entries(kategoriDuygu).map(([k, v]) => ({
    kategori: k,
    skor: v.toplam > 0 ? Math.round(((v.poz - v.neg) / v.toplam) * 100) : 0,
    toplam: v.toplam,
  })).sort((a, b) => Math.abs(b.skor) - Math.abs(a.skor));

  res.status(200).json({ endeks: Math.round(endeks), etiket, renk, aciklama, kategoriSkolar, haberSayisi: toplam, ts: Date.now() });
}
