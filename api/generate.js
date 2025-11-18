import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { company } = await req.json()

  const prompt = `Write a 7-email cold outreach sequence targeting ${company}. Personalize using real recent news, funding, product launches, or LinkedIn activity. Return ONLY valid JSON in this exact format (no extra text): {"emails": [{"subject": "string", "body": "string"}, {"subject": "string", "body": "string"}, {"subject": "string", "body": "string"}, {"subject": "string", "body": "string"}, {"subject": "string", "body": "string"}, {"subject": "string", "body": "string"}, {"subject": "string", "body": "string"}]}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY`,
      'Content-Type': 'application/json',
      'HTTP-Referer': req.headers.get('referer') || '',
      'X-Title': 'ColdEmailWizard'
    },
    body: JSON.stringify({
      model: 'x-ai/grok-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  })

  const data = await response.json()
  return Response.json(JSON.parse(data.choices[0].message.content.trim()))
}
