exports.handler = async (event) => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "API key no configurada. Anade ANTHROPIC_API_KEY en Netlify." }),
    };
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const prompt = `You are a senior geopolitical analyst with thirty years standing, in the tradition of Mackinder, Spykman, Kissinger and Brzezinski, writing for an international wire service.

Today is ${today}.

Produce a decision-grade geopolitical intelligence brief. Select 8 of the most strategically significant ongoing global developments. Rank them by importance. Cover at least 6 distinct macro-regions. Include at least 2 items about small-but-pivotal states or chokepoints.

OUTPUT FORMAT - CRITICAL:
Respond with ONE valid JSON object and NOTHING ELSE. No preamble, no markdown fences, no commentary.

{
  "edition_date": "${today}",
  "panorama": "One authoritative paragraph (60-90 words): the master narrative — the single most important structural shift on the board right now.",
  "developments": [
    {
      "rank": 1,
      "region": "exactly one of: North America | Europe | Russia & Post-Soviet | East Asia | South & Central Asia | Southeast Asia & Pacific | Middle East & North Africa | Sub-Saharan Africa | Latin America | Maritime Commons",
      "country": "Primary country or place, short",
      "headline": "Sharp wire-style headline in Title Case, max 12 words",
      "what_happened": "2-3 sentences of recent facts.",
      "why_it_matters": "2-3 sentences on strategic significance.",
      "reading": "2-3 sentences through geography, power and history.",
      "scenarios": [
        { "label": "Most-likely path", "probability": 60 },
        { "label": "Alternative path", "probability": 30 }
      ],
      "exposed_sectors": ["Sector or company 1", "Sector or company 2"],
      "confidence": "High",
      "memorable_fact": "One striking verifiable fact."
    }
  ],
  "watchlist": [
    "Thing to watch in next 2-4 weeks.",
    "Thing to watch in next 2-4 weeks.",
    "Thing to watch in next 2-4 weeks.",
    "Thing to watch in next 2-4 weeks.",
    "Thing to watch in next 2-4 weeks."
  ],
  "sources_note": "Based on knowledge current to mid-2025, supplemented by analytical judgment."
}

Rules: exactly 8 developments, exactly 5 watchlist items, probabilities are integers, British English. Output ONLY the JSON.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 6000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Error de Anthropic: " + errorText }),
      };
    }

    const data = await response.json();
    const fullText = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    let parsed = null;
    try {
      const first = fullText.indexOf("{");
      const last = fullText.lastIndexOf("}");
      if (first !== -1 && last !== -1) {
        parsed = JSON.parse(fullText.slice(first, last + 1));
      }
    } catch (e) {
      parsed = null;
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(parsed ? { data: parsed } : { raw: fullText, parseError: true }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Error interno: " + err.message }),
    };
  }
};
