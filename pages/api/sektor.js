// SEKTÖR ETKİ HARİTASI — haber → sektör → BIST hisseleri otomatik eşleştirme
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { metin, kategori } = req.body;
  if (!metin) return res.status(400).json({ error: "metin boş" });

  // Haber → Sektör → Hisse eşleme tablosu
  const SEKTOR_MAP = {
    "ENERJİ_PETROL": {
      tetikleyici: ["petrol","brent","wti","opec","crude","oil","enerji","boru hattı","pipeline","lng","doğalgaz","natural gas","ham petrol","rafineri"],
      hisseler: [
        { sembol:"TUPRS", isim:"Tüpraş", etki:"DOĞRUDAN", aciklama:"Türkiye'nin en büyük rafinericisi — ham petrol fiyatından doğrudan etkilenir" },
        { sembol:"PETKM", isim:"Petkim", etki:"DOĞRUDAN", aciklama:"Petrokimya — ham madde olarak petrol kullanır" },
        { sembol:"AYGAZ", isim:"Aygaz", etki:"ORTA", aciklama:"LPG dağıtımı — enerji fiyatlarıyla ilişkili" },
        { sembol:"THYAO", isim:"THY", etki:"TERS", aciklama:"Yakıt maliyeti artar — petrol yükselince negatif etki" },
        { sembol:"PGSUS", isim:"Pegasus", etki:"TERS", aciklama:"Yakıt maliyeti yüksek oran — petrol artışı zararına" },
      ],
    },
    "ENERJİ_YENİLENEBİLİR": {
      tetikleyici: ["yenilenebilir","solar","wind","güneş","rüzgar","nükleer","nuclear","yeşil enerji","green energy","carbon","karbon"],
      hisseler: [
        { sembol:"AKSEN", isim:"Aksen Enerji", etki:"DOĞRUDAN", aciklama:"Yenilenebilir enerji üretimi" },
        { sembol:"ZOREN", isim:"Zorlu Enerji", etki:"DOĞRUDAN", aciklama:"Rüzgar ve doğalgaz santral" },
        { sembol:"EUPWR", isim:"Eüraş", etki:"ORTA", aciklama:"Enerji alım-satım" },
      ],
    },
    "BANKACILIK": {
      tetikleyici: ["faiz","merkez bankası","tcmb","fed","ecb","enflasyon","inflation","interest rate","monetary","para politikası","kredi","npl","loan","banka","banking","rate cut","rate hike","tüfe","cpi"],
      hisseler: [
        { sembol:"GARAN", isim:"Garanti BBVA", etki:"DOĞRUDAN", aciklama:"Faiz değişiminden net faiz marjı etkilenir" },
        { sembol:"AKBNK", isim:"Akbank", etki:"DOĞRUDAN", aciklama:"Büyük özel banka — faize duyarlı" },
        { sembol:"YKBNK", isim:"Yapı Kredi", etki:"DOĞRUDAN", aciklama:"Kamu-özel ortaklık bankası" },
        { sembol:"ISCTR", isim:"İş Bankası", etki:"DOĞRUDAN", aciklama:"Türkiye'nin en büyük bankası" },
        { sembol:"HALKB", isim:"Halkbank", etki:"ORTA", aciklama:"Kamu bankası — politika faizine hassas" },
        { sembol:"VAKBN", isim:"Vakıfbank", etki:"ORTA", aciklama:"Kamu bankası" },
        { sembol:"TSKB", isim:"TSKB", etki:"ORTA", aciklama:"Yatırım bankası — uzun vadeli kredi" },
      ],
    },
    "SAVUNMA_HAVACILIK": {
      tetikleyici: ["savunma","defense","nato","asker","military","f-35","drone","insansız","bayraktar","roketsan","havelsan","aselsan","hava kuvvetleri","air force","savaş","conflict","gerilim","tension","silah","weapon","pentagon"],
      hisseler: [
        { sembol:"ASELS", isim:"Aselsan", etki:"DOĞRUDAN", aciklama:"Türkiye'nin lider savunma elektroniği şirketi" },
        { sembol:"TAVHL", isim:"TAV Havalimanları", etki:"TERS", aciklama:"Çatışma → seyahat düşer → negatif" },
        { sembol:"THYAO", isim:"THY", etki:"TERS", aciklama:"Jeopolitik gerilim uçuşları olumsuz etkiler" },
        { sembol:"KCHOL", isim:"Koç Holding", etki:"ORTA", aciklama:"Savunma yatırımları — çeşitlendirilmiş portföy" },
      ],
    },
    "HAVACILIK_TURİZM": {
      tetikleyici: ["turizm","tourism","havayolu","airline","airport","seyahat","travel","uçuş","flight","otel","hotel","tatil","holiday","summer","yaz","visitor","ziyaretçi"],
      hisseler: [
        { sembol:"THYAO", isim:"THY", etki:"DOĞRUDAN", aciklama:"Türkiye'nin bayrak taşıyıcısı" },
        { sembol:"PGSUS", isim:"Pegasus", etki:"DOĞRUDAN", aciklama:"Düşük maliyetli havayolu" },
        { sembol:"TAVHL", isim:"TAV Havalimanları", etki:"DOĞRUDAN", aciklama:"Havalimanı işletmecisi — yolcu sayısına bağlı" },
        { sembol:"OYAKC", isim:"Oyak Çimento", etki:"NÖTR", aciklama:"Dolaylı altyapı bağlantısı" },
      ],
    },
    "PERAKENDE_TÜKETİM": {
      tetikleyici: ["perakende","retail","tüketim","consumption","enflasyon","inflation","alışveriş","shopping","fiyat artışı","price","market","süpermarket","supermarket","tüketici","consumer","ücret","wage","asgari ücret","minimum wage"],
      hisseler: [
        { sembol:"BIMAS", isim:"BIM", etki:"DOĞRUDAN", aciklama:"Discount perakende — enflasyon döneminde güçlü" },
        { sembol:"MGROS", isim:"Migros", etki:"DOĞRUDAN", aciklama:"Süpermarket zinciri" },
        { sembol:"ULKER", isim:"Ülker", etki:"ORTA", aciklama:"FMCG — hammadde maliyeti vs fiyatlama gücü" },
        { sembol:"ARCLK", isim:"Arçelik", etki:"ORTA", aciklama:"Dayanıklı tüketim — faiz ve gelire duyarlı" },
      ],
    },
    "İNŞAAT_GYO": {
      tetikleyici: ["inşaat","construction","konut","housing","gayrimenkul","real estate","mortgage","kredi","kira","rent","emlak","property","çimento","cement","çelik","steel","demir","iron"],
      hisseler: [
        { sembol:"EKGYO", isim:"Emlak GYO", etki:"DOĞRUDAN", aciklama:"Türkiye'nin en büyük GYO'su" },
        { sembol:"OYAKC", isim:"Oyak Çimento", etki:"DOĞRUDAN", aciklama:"İnşaat malzemesi — konut sektörüyle doğru orantılı" },
        { sembol:"EREGL", isim:"Ereğli Demir Çelik", etki:"ORTA", aciklama:"Çelik — inşaat talebi doğrudan etkiler" },
        { sembol:"SISE", isim:"Şişecam", etki:"ORTA", aciklama:"Cam — inşaat ve otomotiv" },
      ],
    },
    "TEKNOLOJİ_YAPAYZEKa": {
      tetikleyici: ["teknoloji","technology","yapay zeka","ai","artificial intelligence","nvidia","chip","yarı iletken","semiconductor","cloud","bulut","yazılım","software","dijital","digital","openai","llm","gpu","data center","veri merkezi"],
      hisseler: [
        { sembol:"NVDA",  isim:"NVIDIA",  etki:"DOĞRUDAN", aciklama:"AI çip lideri — doğrudan etkilenir" },
        { sembol:"AAPL",  isim:"Apple",   etki:"ORTA",     aciklama:"AI entegrasyonu — cihaz satışı" },
        { sembol:"MSFT",  isim:"Microsoft",etki:"DOĞRUDAN",aciklama:"Azure AI + OpenAI yatırımı" },
        { sembol:"TCELL", isim:"Turkcell", etki:"ORTA",    aciklama:"Dijital servisler, veri merkezi büyümesi" },
        { sembol:"TTKOM", isim:"Türk Telekom",etki:"ORTA", aciklama:"Fiber altyapı ve dijital dönüşüm" },
      ],
    },
    "ALTIN_EMTİA": {
      tetikleyici: ["altın","gold","gümüş","silver","bakır","copper","emtia","commodity","değerli metal","precious metal","xau","inflation hedge","enflasyon koruma","dolar zayıf","dollar weak","safe haven","güvenli liman"],
      hisseler: [
        { sembol:"GLD",   isim:"SPDR Gold ETF",  etki:"DOĞRUDAN", aciklama:"Altın ETF — doğrudan altın fiyatı takip eder" },
        { sembol:"KOZAL", isim:"Koza Altın",     etki:"DOĞRUDAN", aciklama:"Türkiye'nin en büyük altın madeni" },
        { sembol:"KOZAA", isim:"Koza Anadolu",   etki:"DOĞRUDAN", aciklama:"Altın ve bakır madenciliği" },
        { sembol:"IPEKE", isim:"İpek Doğal Enerji",etki:"ORTA",   aciklama:"Doğal kaynak" },
      ],
    },
    "OTOMOTİV": {
      tetikleyici: ["otomotiv","automotive","araba","car","araç","vehicle","elektrikli","electric","ev","tesla","ford","bmw","satış","production","üretim","ihracat","export","çelik","steel"],
      hisseler: [
        { sembol:"FROTO", isim:"Ford Otosan",  etki:"DOĞRUDAN", aciklama:"Ford Türkiye üretim üssü — ihracat ağırlıklı" },
        { sembol:"TOASO", isim:"Tofaş",        etki:"DOĞRUDAN", aciklama:"Fiat-Stellantis ortaklığı" },
        { sembol:"ARCLK", isim:"Arçelik",      etki:"ORTA",     aciklama:"EV komponentleri — çeşitlendirilmiş" },
        { sembol:"EREGL", isim:"Ereğli",       etki:"ORTA",     aciklama:"Otomotiv çeliği tedarikçisi" },
      ],
    },
    "DÖVİZ_KUR": {
      tetikleyici: ["dolar","euro","kur","exchange rate","lira","try","usd","eur","döviz","fx","currency","devaluation","değer kaybı","rezerv","reserve","cari açık","current account","swap","merkez bankası"],
      hisseler: [
        { sembol:"THYAO", isim:"THY",     etki:"DOĞRUDAN", aciklama:"Dolar borcu vs TL gelir — kur artışı zararlı ama ihracat geliri pozitif" },
        { sembol:"FROTO", isim:"Ford Otosan",etki:"POZİTİF",aciklama:"İhracat gelirleri — kur artışı faydalı" },
        { sembol:"TOASO", isim:"Tofaş",   etki:"POZİTİF",  aciklama:"İhracat şirketi — kur artışından kazanır" },
        { sembol:"AKBNK", isim:"Akbank",  etki:"NÖTR",     aciklama:"Hem döviz hem TL pozisyonu var" },
        { sembol:"EREGL", isim:"Ereğli",  etki:"POZİTİF",  aciklama:"Çelik ihracatçısı — dolar geliri" },
      ],
    },
    "KRİPTO_BLOKZINCIR": {
      tetikleyici: ["bitcoin","btc","ethereum","eth","kripto","crypto","blockchain","blokzincir","coinbase","binance","sec","etf","dijital varlık","digital asset","stablecoin","defi","nft"],
      hisseler: [
        { sembol:"BTC-USD", isim:"Bitcoin",  etki:"DOĞRUDAN", aciklama:"Kripto haberleri doğrudan BTC fiyatını etkiler" },
        { sembol:"ETH-USD", isim:"Ethereum", etki:"DOĞRUDAN", aciklama:"Blockchain haberleri" },
        { sembol:"COIN",    isim:"Coinbase", etki:"DOĞRUDAN", aciklama:"Kripto borsası hissesi" },
      ],
    },
    "TÜRKİYE_MAKRO": {
      tetikleyici: ["türkiye","turkey","turkish","erdoğan","hazine","treasury","bütçe","budget","ihracat","export","ithalat","import","cari","seçim","election","reform","program","imf","worldbank","rating","not","moody","fitch","s&p"],
      hisseler: [
        { sembol:"XU100.IS", isim:"BIST100 Endeks", etki:"DOĞRUDAN", aciklama:"Türkiye haberleri tüm endeksi etkiler" },
        { sembol:"GARAN", isim:"Garanti",  etki:"DOĞRUDAN", aciklama:"Yabancı yatırımcı girişinde ilk alınan hisse" },
        { sembol:"THYAO", isim:"THY",      etki:"ORTA",     aciklama:"Türkiye'nin ekonomik yüzü" },
        { sembol:"KCHOL", isim:"Koç Holding",etki:"ORTA",  aciklama:"Ekonominin barometresi" },
        { sembol:"SAHOL", isim:"Sabancı",  etki:"ORTA",    aciklama:"Çeşitlendirilmiş holding" },
      ],
    },
  };

  // Metni tara, eşleşen sektörleri bul
  const metinKucuk = metin.toLowerCase();
  const eslesen = [];

  for (const [sektor, bilgi] of Object.entries(SEKTOR_MAP)) {
    const puan = bilgi.tetikleyici.filter(t => metinKucuk.includes(t.toLowerCase())).length;
    if (puan > 0) {
      eslesen.push({
        sektor: sektor.replace(/_/g, " / "),
        puan,
        hisseler: bilgi.hisseler,
      });
    }
  }

  eslesen.sort((a, b) => b.puan - a.puan);

  // Dedupe — aynı sembol birden fazla sektörde çıkabilir
  const benzersizHisseler = [];
  const goruldu = new Set();
  eslesen.forEach(s => {
    s.hisseler.forEach(h => {
      if (!goruldu.has(h.sembol)) {
        goruldu.add(h.sembol);
        benzersizHisseler.push({ ...h, sektor: s.sektor });
      }
    });
  });

  res.status(200).json({
    eslesen,
    onerilenHisseler: benzersizHisseler,
    sektorSayisi: eslesen.length,
    ts: Date.now(),
  });
}
