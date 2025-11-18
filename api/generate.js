// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company, userKey } = req.body;
  if (!company?.trim()) return res.status(400).json({ error: 'Company required' });

  const finalKey = userKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!finalKey) return res.status(500).json({ error: 'No API key available' });

  const prompt = `Write a personalized 7-email cold outreach sequence for ${company.trim()}. Use real recent news/funding/launches if possible. Return ONLY valid JSON:\n{"emails":[{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."}]}`;

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
        model: 'meta-llama/llama-3.1-70b-instruct',  // ← $0.001 per sequence, 95% as good as GPT-4o
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'AI provider error' });

    let content = data.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed – check your key & credits' });
  }
}
