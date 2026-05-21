export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { preferences, avoid } = req.body || {};

    const prompt = `
Eres un nutricionista experto en dieta keto y anti-inflamatoria.

Crea un menú semanal completo (7 días, comida y cena).

Preferencias del usuario: ${preferences || "ninguna"}
Alimentos a evitar: ${avoid || "ninguno"}

Reglas:
- Keto estricto
- Sin azúcar, sin cereales, sin legumbres
- Máximo 20g carbohidratos por comida
- Proteínas: pollo, ternera, cerdo, pescado, marisco, huevos
- Verduras: brócoli, espinacas, aguacate, calabacín, coliflor, espárragos

Responde SOLO con JSON válido en este formato:

{
  "menu": {
    "Lunes": {
      "Comida": [{ "name": "...", "category": "Pollo|Ternera|Cerdo|Pescado|Marisco|Verdura|Huevo|Otro" }],
      "Cena": [{ "name": "...", "category": "..." }]
    }
  }
}
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
          { role: "system", content: "Eres un asistente que SOLO devuelve JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    // 🔍 DEBUG SAFE (no rompe producción)
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({
        error: "No response from OpenAI",
        raw: data
      });
    }

    let cleaned = text.trim();

    // quitar posibles bloques markdown
    cleaned = cleaned.replace(/```json|```/g, "");

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({
        error: "La IA no devolvió JSON válido",
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
