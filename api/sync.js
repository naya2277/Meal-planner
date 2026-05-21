import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { key } = req.query;
    const { data, error } = await supabase.from('planner_data').select('data').eq('id', key).single();
    if (error) return res.status(200).json({ data: null });
    return res.status(200).json({ data: data.data });
  }

  if (req.method === 'POST') {
    const { key, value } = req.body;
    const { error } = await supabase.from('planner_data').upsert({ id: key, data: value, updated_at: new Date().toISOString() });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
