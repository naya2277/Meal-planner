export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { preferences, avoid } = req.body;

    const prompt = `Eres un nutricionista experto en dieta keto y anti-inflamatoria.
Crea un menú semanal completo (7 días, comida y cena) con estas preferencias: ${preferences}.
Alimentos a evitar: ${avoid || "ninguno"}.
Responde SOLO con JSON válido sin markdown.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    // 🔥 VALIDACIÓN CLAVE
    if (!data.content || !Array.isArray(data.content)) {
      console.error('Respuesta Anthropic inválida:', data);
      return res.status(500).json({
        error: 'Respuesta inválida de Anthropic',
        raw: data
      });
    }

    const text = data.content
      .map(b => b.text || '')
      .join('')
      .replace(/```json|```/g, '')
      .trim();

    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Error generando menú',
      details: error.message
    });
  }
}
