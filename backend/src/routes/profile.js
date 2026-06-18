import express from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateTargets } from '../utils/calories.js';

const router = express.Router();
router.use(requireAuth);

const schema = z.object({
  sex: z.enum(['male','female','other']), age: z.number().int().min(13).max(120), height_cm: z.number().min(90).max(250),
  current_weight_lb: z.number().min(50).max(800), goal_weight_lb: z.number().min(50).max(800),
  activity_level: z.enum(['sedentary','light','moderate','active','very_active']).default('light'),
  pace: z.enum(['slow','standard','aggressive']).default('standard'), dietary_preferences: z.string().max(1000).optional(), struggle_notes: z.string().max(1000).optional()
});

router.get('/', async (req, res, next) => {
  try { const r = await query('SELECT * FROM profiles WHERE user_id=$1', [req.user.id]); res.json({ profile: r.rows[0] || null }); } catch (e) { next(e); }
});

router.put('/', async (req, res, next) => {
  try {
    const b = schema.parse(req.body);
    const targets = calculateTargets(b);
    const r = await query(`INSERT INTO profiles(user_id, sex, age, height_cm, current_weight_lb, goal_weight_lb, activity_level, pace, daily_calorie_target, maintenance_calories, protein_target_g, dietary_preferences, struggle_notes)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT(user_id) DO UPDATE SET sex=EXCLUDED.sex, age=EXCLUDED.age, height_cm=EXCLUDED.height_cm, current_weight_lb=EXCLUDED.current_weight_lb, goal_weight_lb=EXCLUDED.goal_weight_lb, activity_level=EXCLUDED.activity_level, pace=EXCLUDED.pace, daily_calorie_target=EXCLUDED.daily_calorie_target, maintenance_calories=EXCLUDED.maintenance_calories, protein_target_g=EXCLUDED.protein_target_g, dietary_preferences=EXCLUDED.dietary_preferences, struggle_notes=EXCLUDED.struggle_notes, updated_at=NOW()
      RETURNING *`, [req.user.id, b.sex, b.age, b.height_cm, b.current_weight_lb, b.goal_weight_lb, b.activity_level, b.pace, targets.daily_calorie_target, targets.maintenance_calories, targets.protein_target_g, b.dietary_preferences || null, b.struggle_notes || null]);
    await query('INSERT INTO weight_logs(user_id, weight_lb, note) VALUES($1,$2,$3)', [req.user.id, b.current_weight_lb, 'Profile update']);
    res.json({ profile: r.rows[0] });
  } catch (e) { next(e); }
});
export default router;
