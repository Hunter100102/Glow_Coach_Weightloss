import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { estimateFoodFromImage } from '../services/ai.js';
import { uploadMealPhoto, getSignedPhotoUrl } from '../services/storage.js';

const router = express.Router(); router.use(requireAuth);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_IMAGE_MB || 8) * 1024 * 1024 } });
const mealSchema = z.object({ meal_type:z.enum(['breakfast','lunch','dinner','snack','other']).default('other'), title:z.string().min(1).max(120), calories:z.number().int().min(0).max(10000), protein_g:z.number().min(0).max(1000).default(0), carbs_g:z.number().min(0).max(1000).default(0), fat_g:z.number().min(0).max(1000).default(0), fiber_g:z.number().min(0).max(1000).default(0), eaten_at:z.string().datetime().optional() });
function todayRange(){ return { start:`${new Date().toISOString().slice(0,10)}T00:00:00.000Z`, end:`${new Date(Date.now()+86400000).toISOString().slice(0,10)}T00:00:00.000Z`}; }

router.get('/', async (req,res,next)=>{ try { const limit=Math.min(Number(req.query.limit||50),200); const r=await query('SELECT * FROM meals WHERE user_id=$1 ORDER BY eaten_at DESC LIMIT $2',[req.user.id,limit]); for (const m of r.rows) m.photo_url=await getSignedPhotoUrl(m.photo_path); res.json({meals:r.rows}); } catch(e){next(e);} });
router.post('/', async(req,res,next)=>{ try{ const b=mealSchema.parse(req.body); const r=await query(`INSERT INTO meals(user_id,meal_type,title,calories,protein_g,carbs_g,fat_g,fiber_g,eaten_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW())) RETURNING *`,[req.user.id,b.meal_type,b.title,b.calories,b.protein_g,b.carbs_g,b.fat_g,b.fiber_g,b.eaten_at||null]); res.status(201).json({meal:r.rows[0]}); }catch(e){next(e);} });
router.post('/photo', upload.single('photo'), async(req,res,next)=>{ try{ if(!req.file) return res.status(400).json({error:'Missing photo file'}); const profile=(await query('SELECT dietary_preferences, daily_calorie_target FROM profiles WHERE user_id=$1',[req.user.id])).rows[0]; const base64=req.file.buffer.toString('base64'); const estimate=await estimateFoodFromImage({base64Image:base64,mimeType:req.file.mimetype,userContext:JSON.stringify(profile||{})}); let photoPath=null; try { photoPath=await uploadMealPhoto({userId:req.user.id,buffer:req.file.buffer,mimetype:req.file.mimetype}); } catch(storageErr){ console.warn('Photo storage failed:', storageErr.message); }
 const r=await query(`INSERT INTO meals(user_id,meal_type,title,calories,protein_g,carbs_g,fat_g,fiber_g,photo_path,ai_confidence,ai_notes,estimate_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[req.user.id,estimate.meal_type,estimate.title,estimate.calories,estimate.protein_g,estimate.carbs_g,estimate.fat_g,estimate.fiber_g,photoPath,estimate.confidence,estimate.notes,estimate.raw]); const meal=r.rows[0]; meal.photo_url=await getSignedPhotoUrl(meal.photo_path); res.status(201).json({meal,estimate}); }catch(e){next(e);} });
router.delete('/:id', async(req,res,next)=>{ try{ const r=await query('DELETE FROM meals WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,req.user.id]); if(!r.rowCount) return res.status(404).json({error:'Meal not found'}); res.json({ok:true}); }catch(e){next(e);} });
export default router;
