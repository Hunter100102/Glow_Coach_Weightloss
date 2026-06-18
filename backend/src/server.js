import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool } from './db/pool.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import mealRoutes from './routes/meals.js';
import weightRoutes from './routes/weights.js';
import dashboardRoutes from './routes/dashboard.js';
import coachRoutes from './routes/coach.js';
import habitRoutes from './routes/habits.js';

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map(s=>s.trim());
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin(origin, cb){ if(!origin || allowedOrigins.includes(origin)) return cb(null,true); return cb(new Error(`CORS blocked: ${origin}`)); }, credentials:true }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 15*60*1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/health', async (_req,res)=>{ try{ await pool.query('SELECT 1'); res.json({ok:true, app:'FitCoach Pro API'}); }catch(e){ res.status(500).json({ok:false,error:e.message}); }});
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/weights', weightRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/habits', habitRoutes);

app.use((req,res)=>res.status(404).json({error:'Route not found'}));
app.use((err, _req, res, _next)=>{ console.error(err); if(err.name==='ZodError') return res.status(400).json({error:'Invalid input', details:err.errors}); if(err.message?.startsWith('CORS blocked')) return res.status(403).json({error:err.message}); res.status(500).json({error: process.env.NODE_ENV==='production' ? 'Server error' : err.message}); });

const port = process.env.PORT || 10000;
app.listen(port, ()=>console.log(`FitCoach Pro API running on ${port}`));
