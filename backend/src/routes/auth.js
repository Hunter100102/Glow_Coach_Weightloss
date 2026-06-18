import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1).max(80).optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const result = await query(
      'INSERT INTO app_users(email, password_hash, name) VALUES($1,$2,$3) RETURNING id,email,name,created_at',
      [body.email.toLowerCase(), passwordHash, body.name || null]
    );
    const user = result.rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await query('SELECT id,email,name,password_hash FROM app_users WHERE email=$1', [body.email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
    delete user.password_hash;
    res.json({ user, token: signToken(user) });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query('SELECT id,email,name,created_at FROM app_users WHERE id=$1', [req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (err) { next(err); }
});

export default router;
