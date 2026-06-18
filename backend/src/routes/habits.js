import express from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
const router=express.Router(); router.use(requireAuth);
router.get('/',async(req,res,next)=>{try{const r=await query('SELECT * FROM habits WHERE user_id=$1 AND active=true ORDER BY created_at DESC',[req.user.id]);res.json({habits:r.rows});}catch(e){next(e);}});
router.post('/',async(req,res,next)=>{try{const b=z.object({title:z.string().min(1).max(100),target_per_day:z.number().int().min(1).max(20).default(1)}).parse(req.body);const r=await query('INSERT INTO habits(user_id,title,target_per_day) VALUES($1,$2,$3) RETURNING *',[req.user.id,b.title,b.target_per_day]);res.status(201).json({habit:r.rows[0]});}catch(e){next(e);}});
router.post('/:id/log',async(req,res,next)=>{try{const r=await query('INSERT INTO habit_logs(habit_id,user_id) SELECT id,$2 FROM habits WHERE id=$1 AND user_id=$2 RETURNING *',[req.params.id,req.user.id]);if(!r.rowCount)return res.status(404).json({error:'Habit not found'});res.status(201).json({log:r.rows[0]});}catch(e){next(e);}});
export default router;
