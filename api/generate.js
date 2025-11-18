// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company } = req.body;
  if (!company || company.trim() === '') return res.status(400).json({ error: 'Company name required' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set in Vercel' });

  const prompt = `Write a personalized 7-email cold outreach sequence for ${company.trim()}. Use real recent news/funding/launches if possible. Return ONLY valid JSON like this (no markdown, no extra text):\n{"emails":[{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."},{"subject":"...","body":"..."}]}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://coldemailwizard.vercel.app',
        'X-Title': 'ColdEmailWizard',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: 'AI provider error', details: data });
    }

    let content = data.choices?.[0]?.message?.content?.trim() || '';

    // Strip markdown code blocks if present
    const jsonMatch = content.match(/\{[\s\S]*emails[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];
    else if (content.includes('```')) content = content.split('```')[1].trim();

    const parsed = JSON.parse(content);
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate – check your API key & credits' });
  }
}
