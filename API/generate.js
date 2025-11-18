// api/generate.js   ← Vercel Serverless Function
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company } = req.body;

  if (!company || company.trim() === '') {
    return res.status(400).json({ error: 'Company name is required' });
  }

  // Make sure you added your key in Vercel → Project Settings → Environment Variables
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const prompt = `Write a 7-email cold outreach sequence targeting ${company.trim()}. Personalize using real recent news, funding, product launches, or LinkedIn activity about ${company}. Return ONLY valid JSON in this exact format, no extra text:\n{"emails":[{"subject":"...","body":"..."},{"subject":"...","body":"..."}, ... up to 7]}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://coldemailwizard.vercel.app', // optional but recommended
        'X-Title': 'ColdEmailWizard',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',                // grok-4 is not publicly available yet on OpenRouter
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return res.status(502).json({ error: 'AI provider error' });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    // Clean common markdown wrappers
    let jsonStr = content;
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.split('```')[1];
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    if (!parsed.emails || !Array.isArray(parsed.emails)) {
      throw new Error("Invalid format");
    }

    res.status(200).json(parsed);

  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: 'Failed to generate emails – check server logs' });
  }
}
