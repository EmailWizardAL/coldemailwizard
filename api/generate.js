// api/generate.js – FINAL, WORKS 100%
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company, userKey } = req.body;
  if (!company?.trim()) return res.status(400).json({ error: 'Company required' });

  const finalKey = userKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!finalKey) return res.status(500).json({ error: 'No API key available' });

  const prompt = `Generate a personalized 7-email cold outreach sequence for ${company.trim()}. Use real recent news if possible.

Return ONLY pure JSON in this exact format (no markdown, no code blocks, no extra text):

{"emails":[{"subject":"Subject 1","body":"Full email 1"},{"subject":"Subject 2","body":"Full email 2"},{"subject":"Subject 3","body":"Full email 3"},{"subject":"Subject 4","body":"Full email 4"},{"subject":"Subject 5","body":"Full email 5"},{"subject":"Subject 6","body":"Full email 6"},{"subject":"Subject 7","body":"Full email 7"}]}`;

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
        model: 'openai/gpt-4o-2024-08-06',   // ← this exact version works with paid credits
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'AI error' });

    let text =
