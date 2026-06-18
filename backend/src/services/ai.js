import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

function safeJson(text) {
  try { return JSON.parse(text); } catch {}
  const match = text?.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

export async function estimateFoodFromImage({ base64Image, mimeType, userContext = '' }) {
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const prompt = `You are a careful nutrition estimator. Estimate visible food calories and macros from the image. Be honest about uncertainty. Return ONLY valid JSON with keys: title, meal_type, calories, protein_g, carbs_g, fat_g, fiber_g, confidence, notes, items. items must be an array of {name, estimated_portion, calories}. User context: ${userContext}`;
  const response = await client.responses.create({
    model,
    input: [{
      role: 'user',
      content: [
        { type: 'input_text', text: prompt },
        { type: 'input_image', image_url: `data:${mimeType};base64,${base64Image}` }
      ]
    }]
  });
  const text = response.output_text || '';
  const json = safeJson(text);
  if (!json) throw new Error('AI did not return valid JSON');
  return {
    title: String(json.title || 'Estimated meal').slice(0, 120),
    meal_type: ['breakfast','lunch','dinner','snack','other'].includes(json.meal_type) ? json.meal_type : 'other',
    calories: Math.max(0, Math.min(10000, Number.parseInt(json.calories || 0, 10))),
    protein_g: Number(json.protein_g || 0),
    carbs_g: Number(json.carbs_g || 0),
    fat_g: Number(json.fat_g || 0),
    fiber_g: Number(json.fiber_g || 0),
    confidence: String(json.confidence || 'medium'),
    notes: String(json.notes || '').slice(0, 1000),
    raw: json
  };
}

export async function coachReply({ profile, dashboard, recentMeals, memories, message }) {
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const system = `You are FitCoach, a supportive weight-loss accountability coach. Use practical, safe advice. Do not diagnose medical issues. Encourage sustainable habits, protein, hydration, walking, sleep, and logging. Use the user's calorie target and meal data. Keep response concise and specific.`;
  const input = `Profile: ${JSON.stringify(profile || {})}\nDashboard: ${JSON.stringify(dashboard || {})}\nRecent meals: ${JSON.stringify(recentMeals || [])}\nKnown preferences/memories: ${JSON.stringify(memories || [])}\nUser: ${message}`;
  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: input }
    ]
  });
  return response.output_text || 'I am here with you. Log your next meal and take the next small step.';
}
