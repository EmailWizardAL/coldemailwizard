// api/generate.js - fixed November 19, 2025 (ASCII only)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { company, userKey } = req.body;
  if (!company?.trim()) return res.status(400).json({ error: "Company required" });

  const finalKey = userKey?.trim() || process.env.OPENROUTER_API_KEY;
  if (!finalKey) return res.status(500).json({ error: "No API key available" });

  const prompt = `Write a personalized 7-email cold outreach sequence for ${company.trim()}. Use real recent news, funding, product launches, or LinkedIn activity if possible.
Return ONLY valid JSON in this exact format (no markdown, no extra text, no code blocks):
{"emails":[{"subject":"Subject 1","body":"Full email body 1"},{"subject":"Subject 2","body":"Full email body 2"},{"subject":"Subject 3","body":"Full email body 3"},{"subject":"Subject 4","body":"Full email body 4"},{"subject":"Subject 5","body":"Full email body 5"},{"subject":"Subject 6","body":"Full email body 6"},{"subject":"Subject 7","body":"Full email body 7"}]}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${finalKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://coldemailwizard.ai",
        "X-Title": "ColdEmailWizard",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", response.status, err);
      return res.status(502).json({ error: "AI provider error" });
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";

    text = text.replace(/```json|```/g, "").trim();

    const jsonMatch = text.match(/\{[\s\S]*"emails"[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "Invalid AI response" });

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI output" });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
