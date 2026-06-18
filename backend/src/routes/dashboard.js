import express from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
const router=express.Router(); router.use(requireAuth);
export async function buildDashboard(userId){
 const profile=(await query('SELECT * FROM profiles WHERE user_id=$1',[userId])).rows[0]||null;
 const meals=(await query(`SELECT COALESCE(SUM(calories),0)::int calories, COALESCE(SUM(protein_g),0)::float protein_g, COALESCE(SUM(carbs_g),0)::float carbs_g, COALESCE(SUM(fat_g),0)::float fat_g FROM meals WHERE user_id=$1 AND eaten_at >= date_trunc('day', NOW()) AND eaten_at < date_trunc('day', NOW()) + interval '1 day'`,[userId])).rows[0];
 const recentMeals=(await query('SELECT id,title,meal_type,calories,protein_g,eaten_at FROM meals WHERE user_id=$1 ORDER BY eaten_at DESC LIMIT 10',[userId])).rows;
 const weights=(await query('SELECT weight_lb,logged_at FROM weight_logs WHERE user_id=$1 ORDER BY logged_at DESC LIMIT 30',[userId])).rows;
 const target=profile?.daily_calorie_target||0;
 return { profile, today:{...meals, target_calories:target, remaining_calories: target ? target-Number(meals.calories||0) : null, protein_target_g: profile?.protein_target_g||null}, recentMeals, weights };
}
router.get('/', async(req,res,next)=>{ try{ res.json(await buildDashboard(req.user.id)); }catch(e){next(e);} });
export default router;
