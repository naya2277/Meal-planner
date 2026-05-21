export default async function handler(req, res) {
  return res.status(200).json({
    env_check: {
      openai_key_exists: !!process.env.OPENAI_API_KEY
    }
  });
}
