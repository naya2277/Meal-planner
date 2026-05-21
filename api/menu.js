export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { preferences, avoid } = req.body;

    const prompt = `
Eres un nutricionista experto en dieta keto.
Crea un menú semanal (7 días, comida y cena).

Preferencias: ${preferences}
Evitar: ${avoid || "ninguno"}

Reglas:
- keto estricto
- sin azúcar, sin cereales, sin legumbres
- máximo 20g carbohidratos por comida

Responde SOLO JSON válido.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({
        error: "No response from OpenAI",
        raw: data
      });
    }

    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({
      error: "Error generando menú",
      details: error.message
    });
  }
}
