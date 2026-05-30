const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  let jobId = "unknown";
  let store;

  try {
    store = getStore("briefs");
  } catch (e) {
    return { statusCode: 202 };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    jobId = body.jobId || "unknown";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      await store.setJSON(jobId, {
        status: "error",
        error: "API key no configurada. Anade ANTHROPIC_API_KEY en Netlify -> Environment variables.",
      });
      return { statusCode: 202 };
    }

    await store.setJSON(jobId, { status: "pending" });

    const ITEM_COUNT = 8;

    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const prompt = `You are a senior geopolitical analyst with thirty years standing, in the tradition of Mackinder, Spykman, Kissinger and Brzezinski, writing for an international wire service.

TASK: Use web search to research the world's most significant geopolitical developments RIGHT NOW (${today}). Triangulate load-bearing facts across at least two independent sources. Then produce a decision-grade intelligence brief.

Select exactly ${ITEM_COUNT} developments that genuinely move the strategic board. Rank them by relevance. Cover at least SIX distinct macro-regions. Include at least TWO items about small-but-pivotal states or chokepoints.

OUTPUT FORMAT - CRITICAL:
Respond with ONE valid JSON object and NOTHING ELSE. No preamble, no markdown fences, no commentary. The JSON must match this exact schema:

{
  "edition_date": "${today}",
  "panorama": "One authoritative paragraph (60-90 words).",
  "developments": [
    {
      "rank": 1,
      "region": "exactly one of: North America | Europe | Russia & Post-Soviet | East Asia | South & Central Asia | Southeast Asia & Pacific | Middle East & North Africa | Sub-Saharan Africa | Latin America | Maritime Commons",
      "country": "Primary country/place, short",
      "headline": "Sharp wire-style headline in Title Case, max 12 words",
      "what_happened": "2-3 sentences, facts only.",
      "why_it_matters": "2-3 sentences on strategic significance.",
      "reading": "2-3 sentences read through geography, power and history.",
      "scenarios": [
        { "label": "Most-likely path (short)", "probability": 60 },
        { "label": "Alternative path (short)", "probability": 30 }
      ],
      "exposed_sectors": ["Sector or company 1", "Sector or company 2"],
      "confidence": "exactly one of: High | Medium | Low",
      "memorable_fact": "One verifiable memorable fact."
    }
  ],
  "watchlist": [
    "Development to monitor in the next 2-4 weeks."
  ],
  "sources_note": "One sentence on sources used."
}

Rules: ${ITEM_COUNT} developments. 5 watchlist items. Probabilities are integers. British English. Output ONLY the JSON object.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await store.setJSON(jobId, {
        status: "error",
        error: "Error de la API de Anthropic: " + errorText,
      });
      return { statusCode: 202 };
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

    if (parsed) {
      await store.setJSON(jobId, { status: "done", data: parsed });
    } else {
      await store.setJSON(jobId, { status: "done", raw: fullText, parseError: true });
    }

  } catch (err) {
    try {
      await store.setJSON(jobId, { status: "error", error: "Error interno: " + err.message });
    } catch (e) {}
  }

  return { statusCode: 202 };
};
