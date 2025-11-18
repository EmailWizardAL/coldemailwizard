// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company, userKey } = req.body;
  if (!company?.trim()) return res.status(400).json({ error: 'Company required' });

  const finalKey = userKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!finalKey) return res.status(500).json({ error: 'No API key available' });

  const prompt = `Write a personalized 7-email cold outreach sequence for ${company.trim()}. Use real recent news/funding/launches if possible.

Return ONLY valid JSON in this exact format, no markdown, no code blocks, no extra text, no explanations:

{"emails":[{"subject":"First subject","body":"Full email body 1"},{"subject":"Second subject","body":"Full email body 2"},{"subject":"Third subject","body":"Full email body 3"},{"subject":"Fourth subject","body":"Full email body 4"},{"subject":"Fifth subject","body":"Full email body 5"},{"subject":"Sixth subject","body":"Full email body 6"},{"subject":"Seventh subject","body":"Full email body 7"}]}`;

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

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'AI provider error' });

    let content = data.choices?.[0]?.message?.content?.trim() || '';

    // Super-aggressive JSON extraction
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error('No JSON found in response');

    const jsonString = content.substring(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);

    if (!parsed.emails || !Array.isArray(parsed.emails) || parsed.emails.length !== 7) {
      throw new Error('Invalid email structure');
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Generation failed – AI returned invalid format' });
  }
}
