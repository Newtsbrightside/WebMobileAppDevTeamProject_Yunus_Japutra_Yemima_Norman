// AI Fit Advisor: recommends which shoes to buy for a customer whose
// left and right feet may need different sizes.
//
// The LLM call happens ONLY here, on the server. The web app and the phone call
// POST /api/ai/fit-advice; they never see OPENROUTER_API_KEY.
const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { formatShoe } = require('./shoes');
const { isValidSize, closestSize } = require('../lib/sizes');

const router = express.Router();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-5.5';
const AI_TIMEOUT_MS = 20000; // a slow AI must not freeze the app
const MAX_PICKS = 3;

const SYSTEM_PROMPT = `You are the fit advisor of Finishline, a sneaker store.
The customer's left and right feet may need different US sizes.
You get the customer's request and the shoes that come in a size for BOTH feet.
The server already chose the size for each foot; never invent sizes or shoes.
Recommend at most 3 shoes. Prefer, in this order:
1. shoes with an exact size for both feet,
2. shoes that match the activity,
3. the customer's notes (budget, style, comfort).
Answer with JSON only, in this shape:
{"summary": "one or two sentences", "picks": [{"shoe_id": "id from the list", "reason": "max 35 words"}], "tips": "one short fitting tip"}
Write in the language of the customer's notes; use English if the notes are empty.`;

// The shoes a customer can actually wear: in stock, and within half a size for each foot.
function fittingOptions(leftSize, rightSize) {
  const shoes = db.prepare('SELECT * FROM shoes WHERE stock > 0').all().map(formatShoe);
  return shoes
    .map(shoe => {
      const left = closestSize(shoe.sizes, leftSize);
      const right = closestSize(shoe.sizes, rightSize);
      if (left === null || right === null) return null;
      return { shoe, left_size: left, right_size: right, exact_fit: left === leftSize && right === rightSize };
    })
    .filter(Boolean);
}

function matchesActivity(category, activity) {
  const a = activity.toLowerCase();
  const c = category.toLowerCase();
  return a === c || (a === 'everyday' && (c === 'casual' || c === 'lifestyle'));
}

// Used when the AI is down: a plain sort, clearly marked as not written by AI.
function ruleBasedPicks(options, activity) {
  return [...options]
    .sort((a, b) =>
      Number(b.exact_fit) - Number(a.exact_fit) ||
      Number(matchesActivity(b.shoe.category, activity)) - Number(matchesActivity(a.shoe.category, activity)) ||
      a.shoe.price - b.shoe.price)
    .slice(0, MAX_PICKS)
    .map(option => ({
      ...option,
      reason: option.exact_fit
        ? 'Comes in your exact size for both feet.'
        : 'Closest available sizes: we round up by half a size where your size is missing.'
    }));
}

async function askOpenRouter(messages) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set on the server');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Finishline Fit Advisor'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data.error && data.error.message) || `OpenRouter answered ${response.status}`);
    }
    return { text: data.choices?.[0]?.message?.content || '', model: data.model || MODEL };
  } finally {
    clearTimeout(timer);
  }
}

// Models sometimes wrap JSON in ```json fences or add a sentence; take the {...} part.
function parseJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('The AI did not answer with JSON');
  return JSON.parse(text.slice(start, end + 1));
}

// POST /api/ai/fit-advice  (logged-in users)
// Body: { "left_size": 9, "right_size": 9.5, "activity": "Running", "notes": "wide feet, under $150" }
router.post('/fit-advice', authenticateToken, async (req, res) => {
  const leftSize = Number(req.body.left_size);
  const rightSize = Number(req.body.right_size);
  const activity = String(req.body.activity || 'Everyday').trim().slice(0, 40);
  const notes = String(req.body.notes || '').trim().slice(0, 300);

  if (!isValidSize(leftSize) || !isValidSize(rightSize)) {
    return res.status(400).json({ error: 'Enter a US size between 3 and 16 for each foot (half sizes allowed).' });
  }

  const options = fittingOptions(leftSize, rightSize);
  if (options.length === 0) {
    return res.json({
      ai_generated: false,
      summary: `None of our shoes in stock come within half a size of L ${leftSize} / R ${rightSize}.`,
      tips: '',
      picks: []
    });
  }

  const request = {
    customer: { left_size: leftSize, right_size: rightSize, activity, notes },
    shoes: options.map(o => ({
      id: o.shoe.id,
      name: o.shoe.name,
      category: o.shoe.category,
      price: o.shoe.price,
      description: o.shoe.description,
      size_for_left_foot: o.left_size,
      size_for_right_foot: o.right_size,
      exact_for_both_feet: o.exact_fit
    }))
  };

  try {
    const answer = await askOpenRouter([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(request) }
    ]);
    const advice = parseJson(answer.text);

    // Trust nothing: keep only shoes that are really in our list, with the server's sizes.
    const seen = new Set();
    const picks = (Array.isArray(advice.picks) ? advice.picks : [])
      .map(pick => {
        const option = options.find(o => o.shoe.id === String(pick.shoe_id));
        if (!option || seen.has(option.shoe.id)) return null;
        seen.add(option.shoe.id);
        return { ...option, reason: String(pick.reason || '').slice(0, 300) };
      })
      .filter(Boolean)
      .slice(0, MAX_PICKS);

    if (picks.length === 0) throw new Error('The AI picked no shoe from the list');

    return res.json({
      ai_generated: true,
      model: answer.model,
      summary: String(advice.summary || '').slice(0, 500),
      tips: String(advice.tips || '').slice(0, 300),
      picks
    });
  } catch (err) {
    console.error('AI fit advice failed:', err.name === 'AbortError' ? 'timed out' : err.message);
    return res.status(503).json({
      error: 'The AI advisor is not available right now. Here are the shoes that fit your sizes instead.',
      fallback_picks: ruleBasedPicks(options, activity)
    });
  }
});

module.exports = router;
