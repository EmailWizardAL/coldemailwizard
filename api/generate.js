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
      model: "openai/gpt-4o-mini-2024-07-18", // works 100% today
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenRouter error:", response.status, err);
    return res.status(502).json({ error: "AI provider error", details: err.substring(0, 300) });
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || "";

  // Strip markdown code blocks
  text = text.replace(/```json|```/g, "").trim();

  // Extract the JSON object safely
  const jsonMatch = text.match(/\{[\s\S]*"emails"[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("No JSON found in response:", text);
    return res.status(500).json({ error: "Invalid response from AI", raw: text.substring(0, 500) });
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("JSON parse failed:", parseError.message);
    return res.status(500).json({ error: "Failed to parse AI output", raw: jsonMatch[0].substring(0, 500) });
  }

  return res.status(200).json(parsed);

} catch (err) {
  console.error("Unexpected error in /api/generate:", err);
  return res.status(500).json({ error: "Server error" });
}
