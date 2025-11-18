export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { company } = req.body

  const prompt = `Write a 7-email cold outreach sequence targeting ${company}. Personalize using real recent news, funding, product launches, or LinkedIn activity. Return ONLY valid JSON: {"emails": [{"subject": "...", "body": "..."}, ...7 total]}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': req.headers.referer || '',
      'X-Title': 'ColdEmailWizard'
    },
    body: JSON.stringify({
      model: 'x-ai/grok-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  })

  const data = await response.json()
  res.status(200).json(JSON.parse(data.choices[0].message.content.trim()))
}
