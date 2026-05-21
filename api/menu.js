export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { preferences, avoid } = req.body || {};

    const prompt = `
Eres un nutricionista experto en dieta keto.

Crea un menú semanal (7 días, comida y cena).

Preferencias: ${preferences || "ninguna"}
Evitar: ${avoid || "ninguno"}

Reglas:
- keto estricto
- sin azúcar, cereales ni legumbres
- máximo 20g carbohidratos por comida

RESPONDE SOLO JSON válido así:

{
  "menu": {
    "Lunes": {
      "Comida": [{"name":"...","category":"Proteína|Verdura|Huevo|Otro"}],
      "Cena": [{"name":"...","category":"..."}]
    }
  }
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "No response from Gemini",
        raw: data
      });
    }

    // limpiar posibles ```json
    const cleaned = text.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({
        error: "Gemini no devolvió JSON válido",
        raw: cleaned
      });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({
      error: "Error generando menú",
      details: error.message
    });
  }
}
