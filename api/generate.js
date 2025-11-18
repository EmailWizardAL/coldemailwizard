// api/generate.js – FINAL WORKING VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company, userKey } = req.body;
  if (!company?.trim()) return res.status(400).json({ error: 'Company required' });

  const finalKey = userKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!finalKey) return res.status(500).json({ error: 'No API key available' });

  const prompt = `Generate a 7-email cold outreach sequence for ${company.trim()}. Use recent news if possible.

Return ONLY this exact JSON structure with no markdown, no explanations, no code blocks:

{"emails":[{"subject":"Email 1 subject","body":"Email 1 full body"},{"subject":"Email 2 subject","body":"Email 2 full body"},{"subject":"Email 3 subject","body":"Email 3 full body"},{"subject":"Email 4 subject","body":"Email 4 full body"},{"subject":"Email 5 subject","body":"Email 5 full body"},{"subject":"Email 6 subject","body":"Email 6 full body"},{"subject":"Email 7 subject","body":"Email 7 full body"}]}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${finalKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://coldemailwizard.ai',
        'X-Title': 'ColdEmailWizard',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });
