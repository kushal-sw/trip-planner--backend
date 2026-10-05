/**
 * Google Gemini AI Integration Service
 * Powers AI weather forecasts, travel advisories, and localized insider tips.
 */

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Helper to call Gemini REST API with structured JSON output
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }

  const endpoint = `${GEMINI_URL}?key=${apiKey.trim()}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Gemini API returned empty response');
  }

  // Clean potential markdown wrap
  const cleanJson = textOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleanJson);
}

/**
 * Fetch intelligent weather forecast and travel advisory from Gemini AI
 */
async function getGeminiWeather(destinationName = 'Paris') {
  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
You are a real-time meteorological travel engine.
Provide current weather conditions and a realistic 5-day weather forecast starting today (${today}) for the travel destination "${destinationName}".

Return ONLY a valid JSON object matching this exact structure:
{
  "destination": "${destinationName}",
  "current": {
    "temperature": 24,
    "unit": "°C",
    "condition": "Sunny",
    "icon": "☀️",
    "humidity": "55%",
    "windSpeed": "14 km/h",
    "feelsLike": 25
  },
  "forecast": [
    {
      "date": "${today}",
      "condition": "Sunny",
      "icon": "☀️",
      "temperature": {
        "min": 18,
        "max": 26
      },
      "humidity": 50
    }
  ],
  "travelAdvice": "Best hours to visit outdoor attractions are morning or late afternoon to avoid heat.",
  "packingEssentials": ["Light jacket", "Comfortable walking shoes", "Sunscreen"]
}
Note: Exactly 5 items in the forecast array for 5 consecutive days.
`;

    const data = await callGemini(prompt);
    if (data && data.current && Array.isArray(data.forecast)) {
      data.aiPowered = true;
      data.model = GEMINI_MODEL;
      data.retrievedAt = new Date().toISOString();
      return data;
    }
    return null;
  } catch (err) {
    console.warn(`⚠️ Gemini Weather failed: ${err.message}. Falling back to deterministic engine.`);
    return null;
  }
}

/**
 * Fetch intelligent, localized insider travel tips from Gemini AI
 */
async function getGeminiLocalTips(destinationName = 'Paris') {
  try {
    const prompt = `
You are an expert local resident and travel concierge in "${destinationName}".
Generate 6 highly practical, authentic, and hyper-local tips for travelers visiting "${destinationName}".

Include tips across these categories:
- "safety": pickpocket spots, emergency advice, neighborhood safety.
- "food": authentic dish to try, dining etiquette, tipping, budget hack.
- "transport": public transit passes, taxi warnings, best navigation apps.
- "culture": greeting etiquette, dress codes, cultural norms.
- "currency": card acceptance, ATM advice, cash customs.
- "general": timing, language phrase, or hidden gem.

Return ONLY a valid JSON object matching this exact structure:
{
  "destination": "${destinationName}",
  "tips": [
    {
      "category": "safety",
      "text": "Specific actionable tip"
    }
  ]
}
`;

    const data = await callGemini(prompt);
    if (data && Array.isArray(data.tips)) {
      return data.tips.map((t) => ({
        destination: destinationName,
        category: t.category || 'general',
        text: t.text,
        aiGenerated: true,
      }));
    }
    return null;
  } catch (err) {
    console.warn(`⚠️ Gemini Tips failed: ${err.message}`);
    return null;
  }
}

module.exports = {
  callGemini,
  getGeminiWeather,
  getGeminiLocalTips,
};
