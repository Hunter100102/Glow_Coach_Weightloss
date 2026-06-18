import express from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router(); router.use(requireAuth);
const schema = z.object({ weight_lb: z.number().min(50).max(800), note: z.string().max(500).optional(), logged_at: z.string().datetime().optional() });
router.get('/', async (req,res,next)=>{ try { const r=await query('SELECT * FROM weight_logs WHERE user_id=$1 ORDER BY logged_at DESC LIMIT 120',[req.user.id]); res.json({weights:r.rows}); } catch(e){next(e);} });
router.post('/', async (req,res,next)=>{ try { const b=schema.parse(req.body); const r=await query('INSERT INTO weight_logs(user_id,weight_lb,note,logged_at) VALUES($1,$2,$3,COALESCE($4,NOW())) RETURNING *',[req.user.id,b.weight_lb,b.note||null,b.logged_at||null]); await query('UPDATE profiles SET current_weight_lb=$2, updated_at=NOW() WHERE user_id=$1',[req.user.id,b.weight_lb]); res.status(201).json({weight:r.rows[0]}); } catch(e){next(e);} });
export default router;
