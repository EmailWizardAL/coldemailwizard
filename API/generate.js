// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company } = req.body;
  if (!company || company.trim() === '') {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `Write a personalized 7-email cold outreach sequence for ${company.trim()}. 
  Use real recent news, funding rounds, product launches, or LinkedIn activity if possible.
  Return ONLY valid JSON in this exact format (no markdown, no extra text):
  {"emails":[{"subject":"First subject here","body":"Full email body"},{"subject":"...","body":"..."}, ... 7 total]}`;

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
        // THESE MODELS ACTUALLY WORK RIGHT NOW:
        model: 'openai/gpt-4o',                  // ← Best + cheapest fast option
        // model: 'anthropic/claude-3.5-sonnet', // ← Uncomment this line if you want Claude (even better quality)
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean up common markdown wrappers
    if (content.includes('```json')) content = content.split('```json')[1].split('```')[0];
    else if (content.includes('```')) content = content.split('```')[1].trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI output:', content);
      return res.status(500).json({ error: 'AI returned invalid format', details: content.substring(0, 500) });
    }

    res.status(200).json(parsed);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something broke — check logs' });
  }
}
