// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company, userKey } = req.body;
  if (!company?.trim()) return res.status(400).json({ error: 'Company required' });

  const finalKey = userKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!finalKey) return res.status(500).json({ error: 'No API key available' });

  const prompt = `You are a world-class cold email copywriter. Write a personalized 7-email outreach sequence for ${company.trim()}. Use real recent news, funding, product launches, or LinkedIn activity if possible.

Return ONLY a valid JSON object in this exact format (no markdown, no explanations, no code blocks, no extra text):

{"emails":[{"subject":"First subject","body":"Full email body"},{"subject":"Second subject","body":"Full email body"},{"subject":"Third subject","body":"Full email body"},{"subject":"Fourth subject","body":"Full email body"},{"subject":"Fifth subject","body":"Full email body"},{"subject":"Sixth subject","body":"Full email body"},{"subject":"Seventh subject","body":"Full email body"}]}`;

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
        model: 'openai/gpt-4o',   // or 'anthropic/claude-3.5-sonnet' if you prefer
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'AI provider error' });

    let content = data.choices?.[0]?.message?.content?.trim() || '';

    // Aggressive JSON extraction
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}') + 1;
    if (start === -1 || end === 0) throw new Error('No JSON found');

    const jsonStr = content.slice(start, end);
    const parsed = JSON.parse(jsonStr);

    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generation failed – AI returned invalid format' });
  }
}
