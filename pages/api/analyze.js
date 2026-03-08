export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY tanımlı değil. Vercel Environment Variables kontrol edin." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // API hata döndürdüyse detaylı mesaj ver
    if (!response.ok) {
      const mesaj = data?.error?.message || JSON.stringify(data);
      return res.status(response.status).json({ error: mesaj });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Bilinmeyen sunucu hatası" });
  }
}
