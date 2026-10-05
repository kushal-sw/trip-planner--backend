/**
 * Google Gemini AI Integration Service
 * Powers AI weather forecasts, travel advisories, and localized insider tips.
 */

const GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

/**
 * Helper to call Gemini REST API with candidate models and structured JSON output
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }

  const cleanKey = apiKey.trim();

  // Try candidate models in order of availability
  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
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
        // Continue to next candidate model if model unavailable or overloaded (404/503/429)
        continue;
      }

      const json = await response.json();
      const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        continue;
      }

      const cleanJson = textOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      parsed._usedModel = model;
      return parsed;
    } catch (_) {
      // Try next model candidate
      continue;
    }
  }

  return null;
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
      data.model = data._usedModel || 'gemini-flash-lite-latest';
      delete data._usedModel;
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
