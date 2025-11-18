// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company, userKey } = req.body;
  if (!company?.trim()) return res.status(400).json({ error: 'Company required' });

  const finalKey = userKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!finalKey) return res.status(500).json({ error: 'No API key available' });

  const prompt = `Write a personalized 7-email cold outreach sequence for ${company.trim()}. Use real recent news, funding, product launches, or LinkedIn activity if possible. Return ONLY valid JSON in this exact format (no markdown, no extra text):\n{"emails":[{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."}]}`;

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
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return res.status(502).json({ error: data.error?.message || 'AI provider error' });
    }

    let content = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean up any markdown wrappers
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];

    const parsed = JSON.parse(content);

    res.status(200).json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed – check your key & credits' });
  }
}
