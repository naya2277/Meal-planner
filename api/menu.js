export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { preferences, avoid } = req.body;
  const prompt = `Eres un nutricionista experto en dieta keto y anti-inflamatoria.
Crea un menú semanal completo (7 días, comida y cena) con estas preferencias: ${preferences}.
Alimentos a evitar: ${avoid || "ninguno"}.
Reglas: KETO estricto, sin cereales, sin legumbres, sin azúcar, máximo 20g carbos por comida. Proteínas variadas: pollo, ternera, cerdo, pescado, huevos, marisco. Verduras keto: brócoli, espinacas, aguacate, calabacín, coliflor, espárragos.
Responde SOLO con JSON válido sin markdown:
{"menu":{"Lunes":{"Comida":[{"name":"...","category":"Pollo|Ternera|Cerdo|Pescado|Marisco|Verdura|Huevo|Otro"}],"Cena":[{"name":"...","category":"..."}]},"Martes":{"Comida":[...],"Cena":[...]},"Miércoles":{"Comida":[...],"Cena":[...]},"Jueves":{"Comida":[...],"Cena":[...]},"Viernes":{"Comida":[...],"Cena":[...]},"Sábado":{"Comida":[...],"Cena":[...]},"Domingo":{"Comida":[...],"Cena":[...]}}}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Error generando menú', details: error.message });
  }
}
