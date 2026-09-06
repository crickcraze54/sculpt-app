// sculpt-ppl-app/api/nutrition-parse.js
//
// Serverless endpoint (Vercel Node function). Converts natural-language meal
// text into a structured list of { name, quantity, unit } items using the
// OpenAI Responses API with Structured Outputs. This function NEVER invents
// calorie/macro values — it only extracts what the user described. Nutrition
// math is always done client-side from the deterministic saved-food store.
//
// Security notes:
// - Reads the secret from process.env.OPENAI_API_KEY only. The key is never
//   echoed back to the client, logged, or included in error responses.
// - Only POST is accepted. Body must be JSON: { "text": "..." }.
// - Input text is length-capped to prevent abuse.
// - Upstream errors are caught and replaced with a generic message; raw
//   upstream error bodies (which can include request fragments) are never
//   forwarded to the browser.

const MAX_TEXT_LENGTH = 800;
const OPENAI_MODEL = 'gpt-4o-mini';

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' }
        },
        required: ['name', 'quantity', 'unit'],
        additionalProperties: false
      }
    }
  },
  required: ['items'],
  additionalProperties: false
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Do not reveal whether/why the key is missing beyond a generic message.
    return res.status(500).json({ error: 'Nutrition parser is not configured on the server.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  const text = body && typeof body.text === 'string' ? body.text.trim() : '';

  if (!text) {
    return res.status(400).json({ error: 'Request must include a non-empty "text" field.' });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: `Text is too long (max ${MAX_TEXT_LENGTH} characters).` });
  }

  const instructions =
    'You convert a short natural-language description of food someone ate into a ' +
    'structured list of items. Extract ONLY the item name, the quantity, and the unit ' +
    'as implied by the text. Do NOT calculate, estimate, or invent calories, protein, ' +
    'carbs, fat, or any nutrition values — that is done elsewhere from a separate ' +
    'database. If a quantity or unit is not stated, use the most literal reasonable ' +
    'reading (e.g. "an egg" -> quantity 1, unit "piece"; "1 scoop whey" -> quantity 1, ' +
    'unit "scoop"). Keep item names short and generic (e.g. "cooked chicken breast").';

  let upstreamResponse;
  try {
    upstreamResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions,
        input: text,
        text: {
          format: {
            type: 'json_schema',
            name: 'food_items',
            schema: ITEM_SCHEMA,
            strict: true
          }
        },
        temperature: 0
      })
    });
  } catch (networkErr) {
    console.error('nutrition-parse: network error contacting OpenAI', networkErr && networkErr.message);
    return res.status(502).json({ error: 'Could not reach the nutrition parser service.' });
  }

  if (!upstreamResponse.ok) {
    let upstreamText = '';
    try { upstreamText = await upstreamResponse.text(); } catch (e) {}
    console.error('nutrition-parse: upstream error', upstreamResponse.status, upstreamText.slice(0, 500));
    return res.status(502).json({ error: 'The nutrition parser service returned an error.' });
  }

  let data;
  try {
    data = await upstreamResponse.json();
  } catch (e) {
    console.error('nutrition-parse: failed to parse upstream JSON', e && e.message);
    return res.status(502).json({ error: 'The nutrition parser service returned an unreadable response.' });
  }

  const rawText = extractOutputText(data);
  if (!rawText) {
    return res.status(502).json({ error: 'The nutrition parser did not return a result.' });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    return res.status(502).json({ error: 'The nutrition parser returned an invalid result.' });
  }

  if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    return res.status(422).json({ error: 'No food items could be parsed from that text.' });
  }

  const cleanItems = [];
  for (const raw of parsed.items) {
    if (!raw || typeof raw.name !== 'string' || !raw.name.trim()) continue;
    const quantity = Number(raw.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const unit = typeof raw.unit === 'string' && raw.unit.trim() ? raw.unit.trim().toLowerCase() : 'unit';
    cleanItems.push({ name: raw.name.trim().slice(0, 120), quantity, unit: unit.slice(0, 20) });
  }

  if (!cleanItems.length) {
    return res.status(422).json({ error: 'No valid food items could be parsed from that text.' });
  }

  return res.status(200).json({ items: cleanItems });
};

function extractOutputText(data) {
  if (!data) return '';
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c && typeof c.text === 'string' && c.text.trim()) return c.text.trim();
        }
      }
    }
  }
  return '';
}
